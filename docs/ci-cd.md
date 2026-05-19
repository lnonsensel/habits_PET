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

## Рычаги запуска

Три уровня: локальная машина → GitHub Actions → ArgoCD. Каждый следующий ближе к продакшну.

```
┌─────────────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 1: Локально                                                │
│  pytest / npm test / act                                            │
│  Цель: быстрая проверка до пуша                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ git push
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 2: GitHub Actions                                          │
│  PR → тесты  /  push main → тесты + сборка + update-manifests     │
│  Цель: валидация и публикация версионированного образа             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ коммит kustomization.yaml
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 3: ArgoCD                                                  │
│  auto-sync / ручной sync                                           │
│  Цель: доставка в кластер                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Уровень 1 — Локально

Самый быстрый способ поймать ошибку до любого пуша.

#### Тесты напрямую

```bash
# Backend: pytest + TestContainers (нужен запущенный Docker)
cd backend
pytest tests/ -v --tb=short

# с покрытием
pytest tests/ -v --cov=app --cov-report=term-missing

# один конкретный тест
pytest tests/integration/test_auth.py -v

# Frontend: Vitest
cd frontend
npm test -- --run

# с покрытием
npm test -- --run --coverage
```

#### act — полная симуляция GitHub Actions

`act` читает `.github/workflows/ci-cd.yml` и запускает джобы в Docker-контейнерах, имитируя GitHub runner.

```bash
# Симуляция pull_request: запустятся только test-backend + test-frontend
act pull_request

# Симуляция push в main: полный pipeline (до update-manifests)
act push

# Один конкретный джоб — быстро, без остальных
act push -j test-backend
act push -j test-frontend
act push -j build-backend   # пушит реальный образ на Docker Hub

# Посмотреть все джобы без запуска
act push --dry-run
```

Файл `.secrets` нужен для джобов build и update-manifests:
```
DOCKERHUB_USERNAME=...
DOCKERHUB_TOKEN=...
GITHUB_TOKEN=...
```

| Джоб | Нужны secrets | Делает реальный side-effect |
|---|---|---|
| test-backend | нет | нет |
| test-frontend | нет | нет |
| version | GITHUB_TOKEN | создаёт git-тег в репозитории |
| build-backend/frontend | DOCKERHUB_* | пушит образ на Docker Hub |
| update-manifests | GITHUB_TOKEN | коммитит в репозиторий |

#### Smoke-тест вручную

```bash
# Проверить staging после любого деплоя
STAGING_URL=http://your-server:81 bash scripts/smoke-test.sh
```

---

### Уровень 2 — GitHub Actions

Запускается автоматически при событиях git или вручную через UI.

#### Pull Request → только тесты

При открытии или обновлении PR запускаются **только** `test-backend` и `test-frontend`. Сборка и деплой не происходят. Мёрдж заблокирован если тесты красные.

```
PR открыт / обновлён
    ↓
test-backend ──┐
               ├── ✅ оба зелёные → мёрдж разблокирован
test-frontend ─┘   ❌ один красный → мёрдж заблокирован
```

#### Push в main → полный pipeline

Merge PR или прямой пуш в `main` запускает всю цепочку:

```
push → test-backend ──┐
       test-frontend ─┤
                      └── version → build-backend ──┐
                                    build-frontend ─┘
                                          ↓
                                   update-manifests
                                   (коммит [skip ci])
```

Итого ~5–10 минут от пуша до появления нового тега в `kustomization.yaml`.

#### Ручной запуск (workflow_dispatch)

Для перезапуска pipeline без изменений в коде:

**GitHub UI:** репозиторий → Actions → CI/CD Pipeline → Run workflow → ввести причину → Run workflow

**GitHub CLI:**
```bash
gh workflow run ci-cd.yml --ref main -f reason="force redeploy"

# Следить за прогрессом
gh run watch
```

Workflow_dispatch запускает полный pipeline (как push в main) — тесты, сборка, update-manifests.

---

### Уровень 3 — ArgoCD

ArgoCD работает внутри кластера и сам тянет изменения из git. CI не имеет прямого доступа к кластеру.

#### Авто-синхронизация (основной путь)

После того как `update-manifests` делает коммит в `kustomization.yaml`, ArgoCD обнаруживает изменение и синхронизирует кластер — без каких-либо действий со стороны разработчика.

```
коммит [skip ci] → main
        ↓
ArgoCD polling (каждые 3 мин) или webhook
        ↓
Обнаружен diff в kustomization.yaml
        ↓
kubectl apply -k k8s/overlays/staging
        ↓
Rolling update подов
        ↓
Status: Synced + Healthy
```

Время от пуша кода до `Healthy` в кластере: **~10–15 минут** (CI ~8 мин + ArgoCD polling до 3 мин + rolling update ~1–2 мин).

#### Ручной sync через UI

ArgoCD UI → приложение `habit-pet-staging` → кнопка **Sync** → Synchronize.

Полезно когда нужно не ждать polling-цикл (3 мин).

#### Ручной sync через CLI

```bash
# argocd CLI (требует логин)
argocd login localhost:8080 --username admin --password <пароль>
argocd app sync habit-pet-staging

# Следить за синхронизацией
argocd app wait habit-pet-staging --sync --health --timeout 300

# Через kubectl (без argocd CLI)
kubectl patch application habit-pet-staging -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'
```

#### Принудительный sync (force)

Применяет манифесты даже если ArgoCD считает их синхронизированными. Используется при застрявшем статусе.

```bash
argocd app sync habit-pet-staging --force
```

---

### Сравнительная таблица

| Рычаг | Что запускает | Побочный эффект | Время |
|---|---|---|---|
| `pytest tests/` | только backend тесты | нет | ~30–60 с |
| `npm test -- --run` | только frontend тесты | нет | ~10–20 с |
| `act pull_request` | тесты (оба) | нет | ~2–4 мин |
| `act push` | полный pipeline локально | образ на Docker Hub + git-тег + коммит манифеста | ~10–20 мин |
| PR в GitHub | тесты (оба) | нет | ~3–5 мин |
| push в main | полный pipeline | образ на Docker Hub + git-тег + коммит манифеста | ~8–12 мин |
| workflow_dispatch | полный pipeline | то же что push в main | ~8–12 мин |
| ArgoCD auto-sync | деплой в кластер | rolling update подов | до 3 мин после коммита |
| ArgoCD UI Sync | деплой в кластер | rolling update подов | ~1–2 мин |
| `argocd app sync` | деплой в кластер | rolling update подов | ~1–2 мин |

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
