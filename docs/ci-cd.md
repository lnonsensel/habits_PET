# CI/CD + GitOps

Автоматизация по GitOps-модели: Git — единственный источник истины о состоянии кластера. ArgoCD синхронизирует кластер с манифестами автоматически.

---

## Зачем GitOps?

Классический push-based деплой (CI → SSH → `docker compose up`) имеет принципиальные ограничения:

| | Push-based (было) | GitOps (стало) |
|---|---|---|
| Кто инициирует деплой | CI-система через SSH | Агент внутри кластера |
| Источник истины | скрипт в pipeline | Git-репозиторий |
| Дрифт конфигурации | не обнаруживается | ArgoCD откатывает ручные изменения |
| Откат | перезапустить pipeline | `git revert` манифеста |
| Доступ к кластеру в CI | нужен (SSH-ключи) | не нужен |
| История деплоев | только в CI-логах | коммиты в git |

GitOps решает главную проблему: кластер **всегда соответствует тому, что в git**. Если кто-то изменит деплой вручную через kubectl — ArgoCD это обнаружит и восстановит состояние из git.

---

## Что было сделано

- **GitHub Actions pipeline** — тесты → сборка → пуш образов → обновление манифестов
- **ArgoCD Application** — следит за `k8s/overlays/staging/`, синхронизирует кластер автоматически
- **Авто-версионирование CalVer** — тег `YYYY.MM.DD-{sha}` при каждом merge в `main`
- **Docker-образы на Docker Hub** — immutable теги, `latest` для удобства
- **GitOps-коммит** — CI обновляет `k8s/overlays/staging/kustomization.yaml` и пушит с `[skip ci]`
- **Исправлены K8s пробы** — readinessProbe/livenessProbe теперь используют реальный эндпоинт `/health`

---

## Архитектура пайплайна

```
Developer
    │ git push
    ▼
GitHub (main branch)
    │
    ├─── GitHub Actions ──────────────────────────────────────────────┐
    │      test-backend ──┐                                           │
    │      test-frontend ─┤                                           │
    │                     ├──► version (CalVer tag)                   │
    │                     │         │                                  │
    │                     │    build-backend ──┐                      │
    │                     │    build-frontend ─┤                      │
    │                     │                   ├──► update-manifests   │
    │                     │                   │      │                 │
    │                     │    Docker Hub ◄───┘      │                 │
    │                     │    user/habit-pet-*:tag   │                 │
    │                     │                          ▼                 │
    │                     │    k8s/overlays/staging/kustomization.yaml │
    │                     │    ← kustomize edit set image              │
    │                     │    ← git commit [skip ci]                  │
    └─────────────────────┴───────────────────────────────────────────┘
    │
    │ commit k8s/overlays/staging/kustomization.yaml
    ▼
ArgoCD (watching main / k8s/overlays/staging/)
    │
    ├── обнаруживает diff
    ├── kubectl apply -k k8s/overlays/staging
    │
    ▼
Kubernetes cluster (namespace: habit-pet-staging)
    ├── Deployment/backend     rolling update
    ├── Deployment/frontend    rolling update
    ├── Deployment/celery-worker
    └── Deployment/celery-beat
```

---

## Стадии CI pipeline

### test-backend

Запускает pytest с реальными контейнерами через TestContainers.

- `ubuntu-latest` — Docker socket доступен, TestContainers создаёт `postgres:18` и Redis в изоляции
- Устанавливает `requirements.txt` + тестовые зависимости (`pytest-asyncio`, `testcontainers`, `fakeredis`)
- `pytest tests/ -v --tb=short`

### test-frontend

- Node 20 + `npm ci` (кешируется по `package-lock.json`)
- `npm test -- --run` — однократный прогон Vitest без watch-режима

### version

Запускается только при пуше в `main`, после прохождения обоих тестовых джобов.

**Формат:** `YYYY.MM.DD-{7 символов SHA}` → `2026.05.19-abc1234`

```bash
VERSION="$(date -u +'%Y.%m.%d')-$(git rev-parse --short HEAD)"
git tag "v$VERSION" && git push origin "v$VERSION"
```

Версия передаётся через `outputs` всем downstream-джобам. Тег появляется в GitHub Releases.

**Почему CalVer.** SemVer требует решать `MAJOR.MINOR.PATCH` вручную на каждый релиз. CalVer генерируется автоматически — дата + SHA гарантируют уникальность и моментально показывают, когда и из какого коммита собран образ.

### build-backend / build-frontend

Параллельная сборка и пуш Docker-образов в Docker Hub.

- `docker/setup-buildx-action` — BuildKit с параллельными слоями
- `docker/login-action` — логин через `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN`
- `docker/build-push-action` с GitHub Actions cache

Для каждого образа пушится два тега:

```
your-username/habit-pet-backend:2026.05.19-abc1234   ← immutable, конкретная версия
your-username/habit-pet-backend:latest               ← всегда последняя
```

### update-manifests

Ключевой шаг GitOps — CI записывает новые теги образов в манифесты и пушит в git.

```bash
cd k8s/overlays/staging
kustomize edit set image habit-pet/backend=your-user/habit-pet-backend:2026.05.19-abc1234
kustomize edit set image habit-pet/frontend=your-user/habit-pet-frontend:2026.05.19-abc1234

git add k8s/overlays/staging/kustomization.yaml
git commit -m "ci: update staging images to 2026.05.19-abc1234 [skip ci]"
git push origin main
```

Результат в `k8s/overlays/staging/kustomization.yaml`:
```yaml
images:
  - name: habit-pet/backend
    newName: your-username/habit-pet-backend
    newTag: 2026.05.19-abc1234
  - name: habit-pet/frontend
    newName: your-username/habit-pet-frontend
    newTag: 2026.05.19-abc1234
```

**`[skip ci]`** в commit message предотвращает бесконечный цикл — GitHub Actions пропускает workflow для коммитов с этой меткой. `git pull --rebase` перед пушем обеспечивает корректный merge, если в это время пришёл другой коммит.

---

## ArgoCD

### Что это

ArgoCD — GitOps-оператор для Kubernetes. Работает по pull-модели:

1. Устанавливается один раз в кластер как набор подов
2. Наблюдает за git-репозиторием (по SSH или HTTPS)
3. Когда находит разницу между тем, что в git, и тем, что в кластере — применяет манифесты
4. Если кто-то вручную изменил ресурс через kubectl — ArgoCD это видит и восстанавливает состояние из git (`selfHeal`)

### Application manifest

**Файл:** `k8s/argocd/application.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: habit-pet-staging
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io   # каскадное удаление при kubectl delete
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_ORG/habit-pet.git
    targetRevision: main                        # ветка
    path: k8s/overlays/staging                 # путь к Kustomize overlay
  destination:
    server: https://kubernetes.default.svc     # кластер, где установлен ArgoCD
    namespace: habit-pet-staging
  syncPolicy:
    automated:
      prune: true      # удаляет ресурсы, которых нет в git
      selfHeal: true   # откатывает ручные kubectl-изменения
    syncOptions:
      - CreateNamespace=true    # создаёт namespace если не существует
      - ServerSideApply=true    # используется server-side apply для корректного merge
```

**Перед применением** заменить `YOUR_ORG` в `repoURL` на реальный URL репозитория.

### Установка ArgoCD в кластер

Одноразовая операция:

```bash
# 1. Установить ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. Дождаться готовности
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=120s

# 3. Зарегистрировать Application
kubectl apply -f k8s/argocd/application.yaml

# 4. Получить начальный пароль
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# 5. Port-forward UI (пока нет Ingress)
kubectl port-forward svc/argocd-server -n argocd 8080:443
# → https://localhost:8080  (логин: admin / пароль выше)
```

### Жизненный цикл синхронизации

```
git push манифеста
      │
ArgoCD polling (каждые 3 мин) или webhook
      │
      ├── Обнаружен diff
      │
      ▼
Status: OutOfSync
      │
      ▼
Auto-sync: kubectl apply -k k8s/overlays/staging
      │
      ├── K8s rolling update (по readinessProbe)
      │
      ▼
Status: Synced + Healthy
```

### Полезные команды

```bash
# Статус приложения
kubectl get application habit-pet-staging -n argocd

# Принудительный ресинк
kubectl patch application habit-pet-staging -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# Логи ArgoCD
kubectl logs -n argocd deploy/argocd-application-controller -f

# История деплоев
kubectl get application habit-pet-staging -n argocd -o jsonpath='{.status.history}' | jq .

# Откат к предыдущей версии — через git revert
git revert HEAD  # откатить последний коммит с [skip ci]
git push origin main
# ArgoCD обнаружит изменение и синхронизирует кластер со старым тегом образа
```

---

## Версионирование (CalVer)

```
v2026.05.19-abc1234
 ──────────  ───────
 дата UTC    7 символов SHA
```

```bash
# Просмотр всех версий
git tag --sort=-version:refname | head -10

# Какая версия сейчас в staging
kubectl get deployment backend -n habit-pet-staging \
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# Откат образа без git revert (не GitOps — только для экстренных случаев)
kubectl set image deployment/backend \
  backend=your-user/habit-pet-backend:2026.05.18-xyz9876 \
  -n habit-pet-staging
# ArgoCD через selfHeal откатит обратно — так делать не надо
# Правильный откат: git revert + push
```

---

## Настройка

### GitHub Secrets (актуальный список)

Settings → Secrets and variables → Actions:

| Secret | Описание | Статус |
|---|---|---|
| `DOCKERHUB_USERNAME` | Логин Docker Hub | нужен |
| `DOCKERHUB_TOKEN` | Access token Docker Hub | нужен |
| `SSH_HOST` | ~~IP staging-сервера~~ | **удалить** |
| `SSH_USER` | ~~SSH-пользователь~~ | **удалить** |
| `SSH_PRIVATE_KEY` | ~~Приватный ключ~~ | **удалить** |
| `STAGING_URL` | ~~URL для smoke-тестов~~ | **удалить** |

### Права для `update-manifests`

Джоб коммитит в репозиторий через `secrets.GITHUB_TOKEN`. По умолчанию этот токен имеет права на запись. Если нет — Settings → Actions → General → Workflow permissions → «Read and write permissions».

---

## Структура файлов

```
habit_pet/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                    # CI pipeline (без SSH-деплоя)
├── k8s/
│   ├── argocd/
│   │   └── application.yaml             # ArgoCD Application (применить один раз)
│   ├── base/
│   │   └── backend/
│   │       └── deployment.yaml          # readiness/liveness probe → /health
│   └── overlays/
│       └── staging/
│           └── kustomization.yaml       # auto-updated CI: newName + newTag
├── scripts/
│   └── smoke-test.sh                    # ручная проверка (не в CI)
└── docker-compose.staging.yml           # локальное тестирование с pre-built образами
```

---

## Частые вопросы

**Не видно, когда ArgoCD завершил синхронизацию.**
Добавить шаг в `update-manifests`, который ждёт синхронизации через argocd CLI:
```bash
argocd app wait habit-pet-staging --sync --health --timeout 300
```
Требует дополнительных secrets: `ARGOCD_SERVER` и `ARGOCD_AUTH_TOKEN`.

**Как откатиться?**
```bash
# Найти предыдущий коммит манифеста
git log --oneline k8s/overlays/staging/kustomization.yaml

# Откатить
git revert <hash>
git push origin main
# ArgoCD подхватит изменение и раскатит предыдущий образ
```

**CI не запускается после `update-manifests`?**
Это нормальное поведение — коммит содержит `[skip ci]` в сообщении. GitHub Actions пропускает его намеренно.

**ArgoCD видит приложение как `OutOfSync` сразу после установки?**
Это корректно: манифесты ещё не применялись к кластеру. ArgoCD запустит первый sync автоматически (или через UI).
