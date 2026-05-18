# Habit Pet — Backend Documentation

> Сервис трекинга привычек и микро-целей с real-time уведомлениями, Celery-фоном и REST API.

## Стек

| Слой | Технология |
|---|---|
| Web-фреймворк | FastAPI 0.128 + Uvicorn |
| База данных | PostgreSQL 17 + SQLAlchemy 2.0 + Alembic |
| Кеш / Pub-Sub | Redis 8.4 |
| Фоновые задачи | Celery 5.5 + Celery Beat |
| Валидация | Pydantic 2.12 |
| Контейнеризация | Docker + Docker Compose |

## Архитектурная схема

```
                        ┌─────────────────────────────────────────┐
                        │              Docker Compose              │
                        │                                          │
  Browser/Client        │  ┌──────────┐    ┌──────────────────┐  │
    ──REST──────────────┼─►│  Nginx   │───►│   FastAPI 3000   │  │
    ──SSE───────────────┼─►│ :81/:80  │    │                  │  │
                        │  └──────────┘    │  auth/  crud/    │  │
                        │                  │  sse/   admin/   │  │
                        │                  └──────┬───────────┘  │
                        │                         │               │
                        │          ┌──────────────┼──────────┐   │
                        │          ▼              ▼          ▼   │
                        │  ┌────────────┐ ┌──────────┐ ┌──────┐ │
                        │  │ PostgreSQL │ │  Redis   │ │Redis │ │
                        │  │  :5432     │ │ db/0     │ │db/1  │ │
                        │  │ (ORM/SQL)  │ │(cache,   │ │(Celer│ │
                        │  └────────────┘ │ pub/sub) │ │broker│ │
                        │                 └──────────┘ └──┬───┘ │
                        │                                  │      │
                        │                 ┌────────────────┘      │
                        │                 ▼                        │
                        │  ┌──────────────────┐                   │
                        │  │  Celery Worker   │ (×4 concurrency)  │
                        │  │  Celery Beat     │ (scheduler)       │
                        │  └──────────────────┘                   │
                        └─────────────────────────────────────────┘
```

## Навигация

| Документ | Описание |
|---|---|
| [Getting Started](getting-started.md) | Установка, настройка env-файлов, запуск |
| [Architecture](architecture.md) | Структура кода, слои, паттерны, lifecycle |
| [API Reference](api-reference.md) | Все эндпоинты с примерами запросов |
| [Data Models](data-models.md) | Схема БД, модели, поля, связи |
| [Configuration](configuration.md) | Переменные окружения и настройки |
| [Technology Stack](tech-stack.md) | Обоснование выбора каждой технологии |
| [Background Tasks](background-tasks.md) | Celery задачи и расписание |
| [Testing](testing.md) | Как запускать и писать тесты |

## Быстрый старт

```bash
cd backend
uv venv && uv pip install -r requirements.txt
# Настроить .db.env и .redis.env (см. getting-started.md)
make migrate && make dev
# → http://localhost:3000/docs
```
