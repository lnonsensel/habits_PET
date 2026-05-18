# Architecture

## Структура папок

```
backend/
├── app/
│   ├── core/                      # Инфраструктурный слой
│   │   ├── config.py              # Параметры FastAPI (docs, tags, swagger)
│   │   ├── database.py            # SQLAlchemy engine, SessionLocal, Base, get_session()
│   │   ├── fastapi.py             # Инициализация app, lifespan, middleware, handlers
│   │   ├── logger.py              # RotatingFileHandler + StreamHandler
│   │   └── exceptions/
│   │       ├── base_exception.py  # AppError — базовый класс всех ошибок
│   │       ├── crud_exceptions.py # ObjectNotFoundError, DuplicateKeyError, DatabaseError
│   │       ├── service_exceptions.py  # Auth-ошибки
│   │       ├── redis_exceptions.py    # RateLimitExceededError, LockNotAcquiredError
│   │       └── exception_handlers.py  # Глобальный handler → JSONResponse
│   │
│   ├── models/                    # SQLAlchemy ORM (таблицы БД)
│   │   ├── enums.py               # Все Enum-ы проекта
│   │   ├── user.py                # User, Session
│   │   ├── habit.py               # Habit
│   │   ├── habit_record.py        # HabitRecord
│   │   ├── goal.py                # Goal
│   │   ├── goal_record.py         # GoalRecord
│   │   ├── notification.py        # Notification
│   │   ├── api_key.py             # APIKey
│   │   └── audit_log.py           # AuditLog
│   │
│   ├── schemas/                   # Pydantic DTO (валидация запросов/ответов)
│   │   ├── users.py               # UserCreate, UserUpdate, UserResponse, LoginRequest
│   │   ├── habits.py
│   │   ├── habit_records.py
│   │   ├── goals.py
│   │   ├── goal_records.py
│   │   ├── notifications.py
│   │   └── api_keys.py
│   │
│   ├── crud/                      # Операции с БД
│   │   ├── base.py                # CRUDBase[Model, Create, Update] — generic класс
│   │   ├── router_factory.py      # create_crud_router() — фабрика CRUD-маршрутов
│   │   ├── users.py               # UserCRUD (+ get_by_email, hashing)
│   │   ├── notifications.py       # NotificationCRUD (+ Celery dispatch)
│   │   └── [entity].py            # Остальные — наследуют CRUDBase без изменений
│   │
│   ├── routers/                   # FastAPI роутеры (HTTP-слой)
│   │   ├── __init__.py            # Список всех роутеров
│   │   ├── auth.py                # /auth/register, /auth/login (+ rate limit)
│   │   ├── sse.py                 # /notifications/stream, /notifications/publish
│   │   ├── admin.py               # /admin/* (Basic Auth)
│   │   ├── system.py              # /health, /health/db
│   │   └── crud/                  # Автогенерированные CRUD-маршруты
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── auth_service.py    # AuthService: register_user, login_user
│   │   └── redis/
│   │       ├── client.py          # init_redis, close_redis, get_redis
│   │       ├── cache.py           # CacheService: get/set/delete/invalidate_prefix
│   │       ├── sessions.py        # SessionService: create/get/delete (sliding TTL)
│   │       ├── rate_limit.py      # RateLimitService: sliding window (sorted set)
│   │       ├── locks.py           # LockService: NX SET с ownership token
│   │       └── pubsub.py          # PubSubService: publish/subscribe (async gen)
│   │
│   └── tasks/                     # Celery
│       ├── celery_app.py          # Celery instance, Beat schedule
│       ├── notifications.py       # send_notification (max 3 retries)
│       └── periodic.py            # check_streaks, send_daily_reminders, ...
│
├── alembic/                       # Миграции БД
├── tests/                         # Тесты (integration, redis, tasks)
├── Dockerfile
├── Makefile
└── requirements.txt
```

## Слои приложения

```
HTTP Request
    │
    ▼
┌──────────────────────────────────────────────┐
│                  Middleware                   │
│  log_requests: METHOD PATH → STATUS (Xms)    │
└──────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────┐
│                   Router                      │
│  Валидация path/query params (Pydantic)       │
│  Вызов зависимостей: get_session, get_redis   │
│  Auth зависимости (rate limit, Basic Auth)    │
└──────────────────────────────────────────────┘
    │
    ├──► CRUD layer (CRUDBase / NotificationCRUD)
    │        │
    │        ├──► PostgreSQL (SQLAlchemy Session)
    │        └──► Redis Cache (CacheService)
    │
    └──► Service layer (AuthService, RateLimitService, ...)
             │
             └──► Redis / bcrypt / ...
```

## CRUD Factory

Фабрика `create_crud_router()` генерирует 5 стандартных эндпоинтов для любой сущности из одного вызова:

```python
notifications_crud_router = create_crud_router(
    prefix="/notifications",
    crud=notifications_crud,
    create_schema=NotificationCreate,
    response_schema=NotificationResponse,
    update_schema=NotificationUpdate,
    tags=["Notifications"],
)
```

Что генерируется автоматически:

| Метод | Путь | Кеш |
|---|---|---|
| `POST` | `/{resource}/` | инвалидация list |
| `GET` | `/{resource}/` | TTL 60s |
| `GET` | `/{resource}/{id}` | TTL 300s |
| `PUT` | `/{resource}/{id}` | инвалидация item + list |
| `DELETE` | `/{resource}/{id}` | инвалидация item + list |

## Redis — использование по базам

| База | Назначение | Ключи |
|---|---|---|
| `db/0` | Кеш CRUD-ответов, сессии, rate limit, pub/sub | `habits:list:*`, `session:*`, `rate:*`, `sse:notifications:*` |
| `db/1` | Celery broker (очередь задач) | служебные Celery ключи |
| `db/2` | Celery result backend | результаты задач |

## Kubernetes — схема ресурсов

В staging-окружении Docker Compose заменяется Kubernetes. Соответствие сервисов:

| Docker Compose | Kubernetes |
|---|---|
| `backend` | `Deployment/backend` + `Service/backend` |
| `frontend` | `Deployment/frontend` + `Service/frontend` |
| `db` (postgres) | `StatefulSet/postgres` + `Service/postgres` + `PVC` |
| `cache` (redis) | `Deployment/redis` + `Service/redis` + `PVC` |
| `celery_worker` | `Deployment/celery-worker` |
| `celery_beat` | `Deployment/celery-beat` (strategy: Recreate) |
| `reverse-proxy` (nginx) | `Ingress` (nginx ingress controller) |
| `.env` файлы | `ConfigMap` (нечувствительные) + `Secret` (пароли) |

Управление манифестами — через Kustomize: `base/` содержит общие ресурсы, `overlays/staging/` накладывает патчи. Подробнее: [Kubernetes](kubernetes.md).

## Lifecycle приложения

```
docker compose up
    │
    └──► CMD: alembic upgrade head    ← применить все миграции
              │
              └──► uvicorn app.core.fastapi:app
                       │
                       ├── lifespan startup:
                       │      init_redis()  ← создать Redis connection pool
                       │
                       ├── register routers (system, auth, sse, admin, 7×crud)
                       ├── add_exception_handler(AppError, ...)
                       └── add_middleware(log_requests)
```

## Кеширование

Логика в `router_factory.py`:

- **List** (`GET /{resource}/`): ключ `{resource}:list:{user_id}:{habit_id}:{goal_id}:{skip}:{limit}`, TTL 60s.
- **Item** (`GET /{resource}/{id}`): ключ `{resource}:item:{id}`, TTL 300s.
- **Write** (POST/PUT/DELETE): удаляет `{resource}:item:{id}` и инвалидирует все `{resource}:list:*`.

## Обработка ошибок

```
AppError (HTTP 500)
├── CRUDError (500)
│   ├── ObjectNotFoundError    → 404
│   ├── DuplicateKeyError      → 409
│   └── DatabaseError          → 500
├── ServiceError (400)
│   └── AuthenticationError
│       ├── UserAlreadyExistsError    → 400
│       ├── PasswordRequiredError     → 422
│       ├── PasswordNotAllowedError   → 400
│       └── InvalidCredentialsError  → 401
├── RateLimitExceededError     → 429
└── LockNotAcquiredError       → 409
```

Все `AppError` перехватываются `app_error_handler` и возвращаются как `{"detail": "..."}`.  
Необработанные исключения логируются и возвращают `500 Internal server error`.
