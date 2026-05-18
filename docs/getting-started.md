# Getting Started

## Prerequisites

| Инструмент | Версия | Зачем |
|---|---|---|
| Python | 3.13+ | Runtime |
| [uv](https://github.com/astral-sh/uv) | latest | Управление venv и пакетами |
| Docker | 24+ | Контейнеры |
| Docker Compose | v2.x | Оркестрация сервисов локально |

## Установка (локально, без Docker)

```bash
cd backend

# 1. Создать виртуальное окружение
uv venv

# 2. Установить зависимости
uv pip install -r requirements.txt

# 3. Настроить переменные окружения (см. секцию ниже)

# 4. Применить миграции
make migrate

# 5. Запустить dev-сервер (с автоперезагрузкой)
make dev
```

Приложение доступно по адресу `http://localhost:3000`.  
Swagger UI: `http://localhost:3000/docs`

## Настройка переменных окружения

Три env-файла хранятся в папке `backend/` и не коммитятся в git.

### `.db.env` — PostgreSQL

```dotenv
POSTGRES_USER=habit_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=habitsdb
POSTGRES_HOST=localhost        # 'db' внутри Docker Compose
POSTGRES_PORT=5432
```

### `.redis.env` — Redis

```dotenv
REDIS_PASSWORD=your_redis_password
REDIS_HOST=localhost            # 'cache' внутри Docker Compose
REDIS_PORT=6379
```

### `.admin.env` — Admin Panel

```dotenv
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

> **Совет:** Скопируйте примеры выше и замените значения. Никогда не используйте простые пароли в продакшене.

## Запуск через Docker Compose (рекомендуется)

```bash
# Из корня проекта habit_pet/
docker compose up --build
```

Запустятся:

| Сервис | Адрес |
|---|---|
| Backend API | http://localhost:3000 |
| Frontend | http://localhost:80 |
| Nginx reverse proxy | http://localhost:81 |
| PostgreSQL | localhost:5442 |
| Redis | localhost:6339 |

Первый запуск автоматически применяет миграции (`alembic upgrade head`) перед стартом API.

## Makefile — все команды

| Команда | Описание |
|---|---|
| `make venv` | Создать виртуальное окружение через uv |
| `make install` | Установить все зависимости |
| `make dev` | Запустить dev-сервер с auto-reload на порту 3000 |
| `make prod` | Запустить prod-сервер (4 workers) |
| `make migrate` | Применить все миграции (`alembic upgrade head`) |
| `make migrate-create` | Создать новую миграцию (интерактивно) |
| `make test` | Запустить все тесты |
| `make test-break` | Тесты с остановкой на первой ошибке |
| `make test-cov` | Тесты с HTML-отчётом покрытия |
| `make openapi` | Сгенерировать `openapi.json` |
| `make clean` | Удалить venv, кеши, pyc |
| `make tree` | Записать структуру папок в `tree.txt` |

## Проверка работоспособности

```bash
# Healthcheck
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"2026-05-18T..."}

# БД healthcheck
curl http://localhost:3000/health/db
# → {"status":"ok","database":"connected"}

# Swagger UI
open http://localhost:3000/docs
```

## Первая миграция с нуля

```bash
# Если нужно создать миграции заново:
make migrate-create   # введите имя: "initial"
make migrate
```
