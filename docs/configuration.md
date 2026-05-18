# Configuration

Все настройки передаются через переменные окружения. В локальной разработке — через env-файлы в папке `backend/`. В Docker Compose — через секцию `env_file`.

## `.db.env` — PostgreSQL

| Переменная | Обязательна | По умолчанию | Описание |
|---|---|---|---|
| `POSTGRES_USER` | ✅ | — | Имя пользователя БД |
| `POSTGRES_PASSWORD` | ✅ | — | Пароль пользователя БД |
| `POSTGRES_DB` | ✅ | — | Имя базы данных |
| `POSTGRES_HOST` | ✅ | — | Хост PostgreSQL (`localhost` / `db` в Docker) |
| `POSTGRES_PORT` | ✅ | — | Порт PostgreSQL (обычно `5432`) |

Пример для локальной разработки:

```dotenv
POSTGRES_USER=habit_user
POSTGRES_PASSWORD=dev_password
POSTGRES_DB=habitsdb
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## `.redis.env` — Redis

| Переменная | Обязательна | По умолчанию | Описание |
|---|---|---|---|
| `REDIS_PASSWORD` | ✅ | — | Пароль Redis (`requirepass`) |
| `REDIS_HOST` | ✅ | — | Хост Redis (`localhost` / `cache` в Docker) |
| `REDIS_PORT` | ✅ | — | Порт Redis (обычно `6379`) |

```dotenv
REDIS_PASSWORD=dev_redis_password
REDIS_HOST=localhost
REDIS_PORT=6379
```

## `.admin.env` — Admin Panel

| Переменная | Обязательна | По умолчанию | Описание |
|---|---|---|---|
| `ADMIN_USERNAME` | ✅ | `admin` | Логин для `/admin/*` (HTTP Basic Auth) |
| `ADMIN_PASSWORD` | ✅ | `""` | Пароль для `/admin/*` |

```dotenv
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong_secret_password
```

> Если `ADMIN_PASSWORD` пустой — все Basic Auth запросы будут отклоняться.

## Внутренние переменные приложения

Эти переменные опциональны — приложение работает без них.

| Переменная | По умолчанию | Описание |
|---|---|---|
| `SQL_ECHO` | `"false"` | Логировать все SQL-запросы (`"true"` для отладки) |
| `LOG_DIR` | `/app/logs` | Директория для файлов логов |

Пример включения SQL-логирования:

```bash
SQL_ECHO=true make dev
```

## Конфигурация в Docker Compose

В `docker-compose.yml` каждый сервис получает переменные через `env_file`:

```yaml
backend:
  env_file:
    - backend/.db.env
    - backend/.redis.env
    - backend/.admin.env
  environment:
    POSTGRES_HOST: db     # переопределяет значение из .db.env
    REDIS_HOST: cache     # переопределяет значение из .redis.env
```

`environment` имеет приоритет над `env_file` — так хосты переключаются на имена Docker-сервисов.

## Celery — Redis URLs

Celery-приложение строит URL из тех же переменных Redis, добавляя индексы баз:

```python
broker  = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/1"
backend = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/2"
```

`db/0` остаётся для приложения (кеш, pub/sub, rate limit).
