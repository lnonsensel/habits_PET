# Kubernetes (K8s)

## Зачем нужен Kubernetes?

**Docker Compose** — это инструмент для запуска нескольких контейнеров на **одной** машине. Он удобен для локальной разработки, но не решает проблемы эксплуатации:

| Проблема | Docker Compose | Kubernetes |
|---|---|---|
| Упал контейнер | нужно перезапускать вручную | автоматически перезапускает |
| Нагрузка выросла | нужно менять конфиг вручную | `kubectl scale deployment backend --replicas=5` |
| Обновление без простоя | нет | Rolling Update по умолчанию |
| Несколько машин | не поддерживает | управляет кластером серверов |
| Распределение ресурсов | нет | CPU/memory requests & limits |
| Health checks + маршрутизация | базовые | встроенные readiness/liveness probes |

Kubernetes — это **оркестратор контейнеров**: он берёт Docker-образы и сам решает, где, сколько и как их запускать на кластере из одной или многих машин.

---

## Что было сделано

### Структура

```
k8s/
├── base/                        # Базовые манифесты (переиспользуются в любом env)
│   ├── namespace.yaml
│   ├── configmap.yaml           # Нечувствительные переменные: хосты, порты
│   ├── secret.yaml              # Пароли (в base64, не коммитить — в .gitignore)
│   ├── backend/
│   │   ├── deployment.yaml      # Запуск FastAPI-контейнера
│   │   └── service.yaml         # Внутренний адрес для других подов
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── postgres/
│   │   ├── statefulset.yaml     # Stateful-деплой БД с постоянным хранилищем
│   │   ├── service.yaml         # ClusterIP + headless-сервис
│   │   └── pvc.yaml             # Запрос на постоянный диск (5 Gi)
│   ├── redis/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml             # Запрос на диск (1 Gi)
│   ├── celery/
│   │   ├── worker-deployment.yaml
│   │   └── beat-deployment.yaml # strategy: Recreate (всегда ровно 1 планировщик)
│   └── ingress.yaml             # Внешняя точка входа, роутинг API/WS/SPA
└── overlays/
    └── staging/                 # Staging-специфичные настройки поверх base
        ├── kustomization.yaml   # namespace, image tags, labels
        ├── namespace-staging.yaml
        └── patches/
            ├── backend-replicas.yaml
            ├── celery-worker-replicas.yaml
            └── postgres-storage.yaml    # Уменьшенный диск для staging (2 Gi)
```

### Ресурсы Kubernetes и зачем каждый

**Namespace** — изолированное пространство внутри кластера. Staging и production живут в разных namespace, не мешают друг другу.

**ConfigMap** — хранит нечувствительные переменные окружения (`POSTGRES_HOST=postgres`, `REDIS_PORT=6379`). Монтируется в поды как env.

**Secret** — то же самое, но для паролей. Значения закодированы в base64. В реальном проекте заменяется на [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) или External Secrets Operator — тогда в git хранится только зашифрованный манифест.

**Deployment** — описывает, как запускать stateless-поды (backend, frontend, redis, celery). Kubernetes следит, чтобы всегда работало нужное количество реплик. При обновлении образа делает Rolling Update.

**StatefulSet** — как Deployment, но для stateful-сервисов (PostgreSQL). Гарантирует:
- стабильное сетевое имя пода (`postgres-0`)
- тот же диск при перезапуске
- упорядоченный старт/стоп

**Service (ClusterIP)** — стабильный внутренний DNS-адрес для группы подов. Backend обращается к `postgres:5432`, а не к IP-адресу пода (который меняется при перезапуске).

**Service (Headless)** — нужен для StatefulSet: позволяет обращаться к конкретному поду по имени (`postgres-0.postgres-headless`).

**PersistentVolumeClaim (PVC)** — запрос на диск. Kubernetes сам выделяет диск нужного размера через StorageClass. Данные PostgreSQL и Redis переживают перезапуск подов.

**Ingress** — аналог nginx reverse proxy из docker-compose, но управляемый Kubernetes. Принимает внешний трафик и направляет:
- `/api/*`, `/auth/*`, `/habits/*`, ... → `backend:3000`
- `/notifications/stream/*` → `backend:3000` (с отключённой буферизацией для SSE)
- `/ws/*` → `backend:3000` (WebSocket upgrade)
- `/` → `frontend:80` (SPA)

**Kustomize** — инструмент управления манифестами без Helm. `base/` содержит общие ресурсы, `overlays/staging/` накладывает патчи сверху: меняет namespace, теги образов, размеры дисков. Для production создаётся отдельный `overlays/production/`.

---

## Архитектурная схема в K8s

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Namespace: habit-pet-staging                               │
│                                                             │
│  ┌─────────────┐                                            │
│  │   Ingress   │  habit-pet.staging.example.com            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    ┌────┴────┐         ┌──────────────┐                     │
│    ▼         ▼         │   ConfigMap  │                     │
│  ┌──────┐ ┌──────┐     │  POSTGRES_HOST=postgres            │
│  │front │ │back  │◄────│  REDIS_HOST=redis                  │
│  │end   │ │end   │     └──────────────┘                     │
│  │:80   │ │:3000 │                                          │
│  └──────┘ └──┬───┘     ┌──────────────┐                     │
│              │          │    Secret    │                     │
│         ┌────┴────┐     │  POSTGRES_PASSWORD                │
│         ▼         ▼     │  REDIS_PASSWORD                   │
│    ┌─────────┐ ┌──────┐ └──────────────┘                    │
│    │postgres │ │redis │                                     │
│    │StatefulS│ │Deploy│                                     │
│    └────┬────┘ └──┬───┘                                     │
│         │         │                                         │
│    ┌────┴──┐  ┌───┴──┐   ┌──────────────┐                  │
│    │PVC 2Gi│  │PVC 1G│   │celery-worker  │                  │
│    └───────┘  └──────┘   │celery-beat    │                  │
│                           └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Деплой

### Требования

| Инструмент | Зачем |
|---|---|
| `kubectl` | CLI для управления кластером |
| `kustomize` | Встроен в kubectl (`kubectl kustomize`) |
| Кластер (minikube / kind / cloud) | Где запускаются поды |
| Container registry | Откуда кластер тянет образы |

### Локальное тестирование (minikube)

```bash
# 1. Запустить кластер
minikube start
minikube addons enable ingress

# 2. Собрать образы прямо в minikube (без внешнего registry)
eval $(minikube docker-env)
docker build -t habit-pet/backend:staging ./backend
docker build -t habit-pet/frontend:staging ./frontend

# 3. В deployment.yaml поменять imagePullPolicy на IfNotPresent

# 4. Задеплоить
kubectl apply -k k8s/overlays/staging

# 5. Проверить статус
kubectl get pods -n habit-pet-staging -w

# 6. Пробросить порт для теста без ingress
kubectl port-forward -n habit-pet-staging svc/backend 3000:3000
```

### Деплой в реальный кластер

```bash
# 1. Собрать и запушить образы
docker build -t your-registry.io/habit-pet/backend:staging ./backend
docker push your-registry.io/habit-pet/backend:staging

docker build -t your-registry.io/habit-pet/frontend:staging ./frontend
docker push your-registry.io/habit-pet/frontend:staging

# 2. Обновить newName в overlays/staging/kustomization.yaml
#    images:
#      - name: habit-pet/backend
#        newName: your-registry.io/habit-pet/backend
#        newTag: staging

# 3. Применить манифесты
kubectl apply -k k8s/overlays/staging

# 4. Следить за роллаутом
kubectl rollout status deployment/backend -n habit-pet-staging
```

### Полезные команды

```bash
# Посмотреть итоговые манифесты без применения
kubectl kustomize k8s/overlays/staging

# Логи
kubectl logs -n habit-pet-staging deploy/backend -f
kubectl logs -n habit-pet-staging deploy/celery-worker -f

# Войти в под
kubectl exec -it -n habit-pet-staging deploy/backend -- bash

# Проверить переменные окружения пода
kubectl exec -n habit-pet-staging deploy/backend -- env | grep POSTGRES

# Рестарт деплоя (например после изменения Secret)
kubectl rollout restart deployment/backend -n habit-pet-staging

# Удалить всё staging-окружение
kubectl delete namespace habit-pet-staging
```

---

## Безопасность секретов

`k8s/base/secret.yaml` добавлен в `.gitignore`. В кластер секреты передаются вручную или через CI/CD.

Для продакшна рекомендуется один из вариантов:

| Вариант | Описание |
|---|---|
| [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) | Шифрует Secret ключом кластера, безопасно хранить в git |
| [External Secrets Operator](https://external-secrets.io/) | Тянет секреты из Vault / AWS SSM / GCP Secret Manager |
| CI/CD переменные | Секреты хранятся в GitLab/GitHub и применяются в pipeline |
