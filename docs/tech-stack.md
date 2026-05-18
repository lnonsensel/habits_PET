# Technology Stack

Обоснование выбора каждой технологии проекта. Для каждой библиотеки описано: **что это**, **почему выбрана**, **рассмотренные альтернативы** и **где используется**.

---

## Python 3.13

**Что это:** Язык программирования общего назначения.

**Почему выбран:**
- Доминирует в backend-разработке с FastAPI/Django
- 3.13 — последний стабильный релиз на момент разработки; принёс улучшения GIL (free-threaded mode в экспериментах) и более быстрый интерпретатор
- Богатая экосистема для web (FastAPI, SQLAlchemy, Celery, Redis)
- `match` statement (3.10+) используется в `send_notification` для диспатча по каналу

**Альтернативы:**
- **Go** — лучше производительность, но слабее экосистема web-библиотек; меньше специалистов
- **Node.js** — нативный async, но Python читабельнее, сильнее в data-processing задачах

**Где используется:** весь backend.

---

## FastAPI 0.128

**Что это:** Современный async Python web-фреймворк на основе Starlette и Pydantic.

**Почему выбран:**
- **Async first** — нативная поддержка `async/await` без workaround'ов (в отличие от Django/Flask)
- **Автоматическая OpenAPI-документация** — из аннотаций типов генерируются Swagger UI и ReDoc без дополнительного кода
- **Pydantic-интеграция** — валидация запросов и ответов из коробки через типизацию
- **Dependency Injection** — `Depends(get_session)`, `Depends(get_redis)` — чистое разделение ответственностей
- **Производительность** — один из быстрейших Python-фреймворков (сравним с Go/Node по benchmark'ам)
- **SSE-поддержка** — `StreamingResponse` с async генераторами

**Альтернативы:**
- **Django + DRF** — мощная экосистема, но синхронный по умолчанию; избыточен для API-сервиса без шаблонов
- **Flask** — проще, но нет async, нет автогенерации схем, нет Pydantic-интеграции
- **Starlette** — FastAPI построен на нём; использовать напрямую значит писать FastAPI с нуля

**Где используется:** `app/core/fastapi.py`, все роутеры, `app/crud/router_factory.py`.

---

## SQLAlchemy 2.0

**Что это:** Python ORM и SQL-конструктор запросов.

**Почему выбран:**
- **Версия 2.0** — унифицированный интерфейс async/sync; декларативные модели с типизацией
- **Expressiveness** — сложные JOIN, subquery, aggregation пишутся на Python без raw SQL
- **Alembic-интеграция** — автогенерация миграций из моделей
- **Type safety** — `Mapped[str]`, `mapped_column()` дают IDE-поддержку
- **Flexibility** — можно использовать raw SQL там, где ORM избыточен (admin stats)

**Альтернативы:**
- **Tortoise ORM** — async-first, но меньше возможностей, меньше сообщество
- **Peewee** — проще, но нет async, слабый миграционный инструментарий
- **Raw psycopg** — максимальный контроль, но нет ORM-абстракций; нужно писать SQL вручную

**Где используется:** `app/models/*.py`, `app/crud/*.py`, `app/routers/admin.py`.

---

## PostgreSQL 17

**Что это:** Реляционная СУБД с открытым исходным кодом.

**Почему выбрана:**
- **ACID** — полные гарантии транзакций критичны для данных привычек и прогресса
- **JSONB** — нативное хранение JSON с индексами; используется в `payload`, `scopes`, `context`
- **UUID как PK** — нативная поддержка `UUID` типа без конвертации
- **Производительность** — CTE, оконные функции, индексы по JSON-полям
- **k8s-ready** — StatefulSet с persistence volume; проверенные операторы (Zalando Postgres Operator)
- **17** — последний стабильный релиз; улучшения в vacuum и логической репликации

**Альтернативы:**
- **MySQL/MariaDB** — слабее поддержка JSON и UUID; меньше возможностей
- **SQLite** — только для разработки; нет конкурентного доступа
- **MongoDB** — документо-ориентированная БД; не нужна для реляционных данных привычек

**Где используется:** основное хранилище всех данных.

---

## psycopg 3.3 (psycopg3)

**Что это:** Современный PostgreSQL-драйвер для Python, переписанный с нуля.

**Почему выбран:**
- **Нативный async** — без greenlet и thread pool как в psycopg2; истинный `await`
- **SQLAlchemy 2.0 ready** — рекомендованный драйвер для async SQLAlchemy
- **Binary protocol** — `psycopg-binary` использует libpq C-библиотеку для скорости
- **Prepared statements** — автоматически кешируются повторяющиеся запросы

**Альтернативы:**
- **psycopg2** — синхронный; требует `greenlet` для async через SQLAlchemy, что добавляет накладные расходы
- **asyncpg** — быстрее, но не совместим с SQLAlchemy ORM напрямую

**Где используется:** `app/core/database.py` (URL: `postgresql+psycopg://...`).

---

## Pydantic 2.12

**Что это:** Библиотека валидации данных на основе Python type hints.

**Почему выбрана:**
- **Версия 2.x** — переписана на Rust (pydantic-core), в 5-50× быстрее v1
- **FastAPI-интеграция** — тела запросов и ответов валидируются автоматически из схем
- **Автогенерация JSON Schema** → OpenAPI документация
- **ConfigDict** — `from_attributes=True` для сериализации ORM-объектов без конвертации
- **Строгие типы** — `EmailStr`, `UUID`, кастомные валидаторы

**Альтернативы:**
- **Marshmallow** — популярна, но нет интеграции с type hints; медленнее
- **attrs** — для классов, не для сериализации API

**Где используется:** `app/schemas/*.py`, все модели запросов/ответов.

---

## Alembic 1.18

**Что это:** Инструмент миграций БД для SQLAlchemy.

**Почему выбран:**
- **Официальная интеграция** — от авторов SQLAlchemy; гарантированная совместимость
- **Автогенерация** — `alembic revision --autogenerate` сравнивает модели с текущей схемой БД и генерирует diff
- **Версионирование** — каждая миграция — Python-файл в git; полная история изменений схемы
- **Upward/downward** — каждая миграция имеет `upgrade()` и `downgrade()`

**Альтернативы:**
- **Flyway** — для Java-экосистемы; SQL-based, не интегрируется с SQLAlchemy моделями
- **Django migrations** — встроены в Django, не работают отдельно

**Где используется:** `alembic/`, `make migrate`, `make migrate-create`.

---

## Redis 8.4

**Что это:** In-memory хранилище данных с поддержкой множества структур.

**Почему выбран:**
- **Многофункциональность** — три разных назначения в одном сервисе: кеш, pub/sub, Celery broker; не нужны отдельные инфраструктурные компоненты
- **Скорость** — операции в памяти за микросекунды; идеален для кеша и rate limiting
- **Sorted Sets** — используются для sliding window rate limiting: `ZREMRANGEBYSCORE` + `ZADD` + `ZCARD`
- **Pub/Sub** — нативный механизм для SSE-рассылки уведомлений между подами (K8s-готовность)
- **Persistence** — `--appendonly yes` + `--save 60 1` — данные не теряются при рестарте
- **Логическое разделение** — три базы (`db/0`, `db/1`, `db/2`) в одном сервисе избегают конфликтов ключей

**Альтернативы:**
- **Memcached** — только кеш; нет pub/sub, sorted sets, persistence
- **RabbitMQ** (для broker) — мощнее для сложных routing-сценариев, но добавляет новый сервис
- **Apache Kafka** (для pub/sub) — избыточен для объёма уведомлений трекера привычек

**Где используется:** кеш CRUD, rate limiting, SSE pub/sub, Celery broker (db/1), Celery backend (db/2).

---

## redis-py 5.3 + hiredis 3.3

**Что это:** Python-клиент для Redis; hiredis — C-парсер протокола RESP.

**Почему выбран:**
- **Официальный клиент** — поддерживается Redis Ltd; полная поддержка всех команд
- **Async API** — `redis.asyncio` — нативный async без callbacks
- **hiredis** — C-расширение ускоряет парсинг RESP-протокола в 10× vs pure Python парсер
- `decode_responses=True` — автоматическое декодирование bytes → str

**Где используется:** `app/services/redis/*.py`.

---

## Celery 5.5

**Что это:** Распределённая очередь задач с поддержкой периодического планирования (Celery Beat).

**Почему выбран:**
- **Persistent queue** — задачи не теряются при падении воркера (в отличие от `asyncio.create_task`)
- **Retry с backoff** — `self.retry(exc=exc)` с настраиваемыми `max_retries` и `default_retry_delay`
- **Celery Beat** — встроенный cron-планировщик; не нужен отдельный cron-демон или APScheduler
- **Horizontal scaling** — воркеры масштабируются независимо от API (разные поды в K8s)
- **Redis broker** — использует уже имеющийся Redis; нет дополнительной инфраструктуры
- **Идемпотентность** — проверка `status == SENT` перед выполнением защищает от повторных доставок

**Альтернативы:**
- **asyncio + BackgroundTasks** — нет persistence, нет retry, задачи теряются при рестарте
- **RQ (Redis Queue)** — проще, но нет Beat-scheduler; пришлось бы добавлять APScheduler
- **Dramatiq** — хорошая альтернатива, но меньше сообщество и документация

**Где используется:** `app/tasks/`, `docker-compose.yml` (celery_worker, celery_beat).

---

## Uvicorn 0.40

**Что это:** ASGI-сервер на основе uvloop и httptools.

**Почему выбран:**
- **ASGI** — единственный правильный способ запускать FastAPI (ASGI-приложение)
- **uvloop** — замена стандартного event loop CPython на libuv (C-библиотека); 2-4× быстрее
- **Workers** — `--workers 4` запускает несколько процессов для production (multiprocessing, обходит GIL)
- **Рекомендован FastAPI** — официальный ASGI-сервер в документации FastAPI

**Альтернативы:**
- **Gunicorn** — синхронный WSGI-сервер; не подходит для async FastAPI без uvicorn worker class
- **Gunicorn + uvicorn.workers.UvicornWorker** — production-вариант, но добавляет Gunicorn в зависимости
- **Hypercorn** — ASGI-сервер с поддержкой HTTP/2; менее распространён

**Где используется:** `CMD` в Dockerfile, `make dev`, `make prod`.

---

## bcrypt 4.3 + passlib 1.7

**Что это:** bcrypt — алгоритм хеширования паролей; passlib — обёртка для работы с хешами паролей.

**Почему выбраны:**
- **bcrypt** — адаптивный алгоритм: вычислительно дорог (защита от brute force), встроена соль, работает с любым размером входа
- **passlib** — удобный `CryptContext` с автоматическим обновлением алгоритма; обёртка над bcrypt обеспечивает единый API
- **Безопасность** — bcrypt считается gold standard для хранения паролей в 2024

**Альтернативы:**
- **argon2** — победитель Password Hashing Competition 2015; более современный алгоритм; рекомендован для новых проектов
- **scrypt** — встроен в Python stdlib, но менее стандартизирован
- **SHA-256** — не подходит для паролей (слишком быстрый)

**Где используется:** `app/services/auth/auth_service.py`, `app/crud/users.py`.

---

## python-dotenv 1.2

**Что это:** Загрузка переменных окружения из `.env`-файлов.

**Почему выбрана:**
- **12-factor app** — конфигурация через env vars является стандартом
- **Простота** — `load_dotenv(".db.env")` — одна строка
- **Не перезаписывает** — по умолчанию не заменяет уже установленные переменные (важно для Docker, где переменные установлены через `env_file`)

**Где используется:** `app/core/database.py`, `app/services/redis/client.py`.

---

## pytest 9.0 + testcontainers 4.14

**Что это:** pytest — фреймворк тестирования; testcontainers — запуск Docker-контейнеров в тестах.

**Почему выбраны:**

**pytest:**
- Стандарт de facto в Python-сообществе
- Фикстуры с scope — session/function-уровень
- `asyncio_mode = "auto"` через pytest-asyncio для async-тестов без лишних декораторов
- Расширяемость через плагины

**testcontainers:**
- **Реальная БД в тестах** — ловит SQL-ошибки, ошибки JOIN, проблемы с CASCADE, которые моки пропускают
- **Изоляция** — каждый тест-прогон получает чистую БД, не нужен отдельный тестовый сервер
- **Redis контейнер** — `RedisContainer(password=...)` позволяет тестировать реальную auth

**Альтернативы:**
- **Моки БД** — быстрее, но не ловят SQL-специфичные баги (именно такой баг был с `POSTGRES_PORT` в начале разработки)
- **pytest-django** — специфично для Django
- **SQLite** — не поддерживает PostgreSQL-специфичные типы (UUID, JSONB, ENUMs)

**Где используется:** `tests/fixtures/`, `pyproject.toml` (`asyncio_mode = "auto"`).

---

## fakeredis 2.35

**Что это:** Полная in-memory реализация Redis API для тестирования.

**Почему выбран:**
- **Изоляция** — каждый тест получает чистый Redis-стейт без сайд-эффектов
- **Без Docker** — не нужен Redis-контейнер для unit-тестов; тесты запускаются мгновенно
- **Полная совместимость** — поддерживает все используемые команды: `SET NX EX`, `ZADD`, `ZREMRANGEBYSCORE`, `PUBLISH`/`SUBSCRIBE`
- **Async API** — `fakeredis.aioredis.FakeRedis` совместим с redis-py async интерфейсом

**Исключение:** `tests/redis/test_connection.py` использует реальный `RedisContainer` для проверки auth-логики (именно такой тест поймал бы баг с `${REDIS_PASSWORD}` дословным строковым значением).

**Где используется:** `tests/fixtures/client.py`, `tests/fixtures/redis.py`, `tests/tasks/`.

---

## Docker + Docker Compose

**Что это:** Docker — контейнеризация; Docker Compose — оркестрация нескольких контейнеров локально.

**Почему выбраны:**
- **Воспроизводимость** — `docker compose up --build` поднимает идентичное окружение на любой машине
- **Изоляция** — PostgreSQL, Redis, backend, frontend — каждый в своём контейнере; нет конфликтов версий
- **Production-близость** — в dev используется тот же Docker-образ что в production
- **Путь к K8s** — Docker-образы используются как есть в Kubernetes; Compose — локальный аналог k8s для разработки

**Многосервисная архитектура в Compose:**
- `db` (PostgreSQL) + `cache` (Redis) + `backend` (FastAPI) + `celery_worker` + `celery_beat` + `frontend` + `reverse-proxy` (Nginx)
- `depends_on` с healthcheck гарантирует порядок запуска

**Где используется:** `docker-compose.yml`, `Dockerfile`.
