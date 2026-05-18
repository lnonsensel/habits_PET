# Testing

## Запуск

```bash
cd backend

make test          # все тесты
make test-break    # стоп на первом падении (полезно при разработке)
make test-cov      # с HTML-отчётом покрытия → htmlcov/index.html
```

Или напрямую через pytest:

```bash
.venv/bin/python -m pytest tests/ -v
.venv/bin/python -m pytest tests/redis/ -v                    # только Redis-тесты
.venv/bin/python -m pytest tests/tasks/ -v                    # только Celery-тесты
.venv/bin/python -m pytest tests/integration/test_auth.py -v  # один файл
```

## Структура тестов

```
tests/
├── conftest.py              # global seed (random.seed)
├── fixtures/
│   ├── __init__.py          # экспортирует все фикстуры
│   ├── client.py            # client fixture (TestClient + fake Redis)
│   ├── database.py          # postgres_container, db_engine, db_session
│   └── redis.py             # fake_redis, redis_container
├── integration/             # HTTP E2E тесты
│   ├── test_auth.py
│   ├── test_sse.py
│   ├── test_users_crud.py
│   ├── test_habits_crud.py
│   ├── test_goals_crud.py
│   ├── test_habit_records_crud.py
│   ├── test_goal_records_crud.py
│   ├── test_notifications_crud.py
│   └── test_api_keys_crud.py
├── redis/                   # Unit-тесты Redis-сервисов
│   ├── test_connection.py
│   ├── test_cache.py
│   ├── test_sessions.py
│   ├── test_locks.py
│   └── test_rate_limit.py
└── tasks/                   # Unit-тесты Celery-задач
    ├── conftest.py          # task_session, make_user/habit/record/notification
    ├── test_send_notification.py
    └── test_periodic.py
```

**Итого: 168 тестов.**

## Фикстуры

### `postgres_container` (scope: session)

Запускает контейнер `postgres:18` через testcontainers. Один на весь тестовый запуск, создаёт все таблицы при старте и дропает при завершении.

### `db_engine` (scope: session)

SQLAlchemy engine привязанный к `postgres_container`. Таблицы создаются через `Base.metadata.create_all()`.

### `db_session` (scope: function)

Для каждого теста:
1. Открывает соединение и начинает транзакцию
2. Создаёт Session привязанный к этому соединению
3. Переопределяет `get_session` dependency в FastAPI
4. После теста — откатывает транзакцию (изоляция данных между тестами)

### `client` (scope: function)

`TestClient` FastAPI с:
- `fakeredis.aioredis.FakeRedis` вместо реального Redis (переопределяет `get_redis`)
- `init_redis`/`close_redis` замоканы через `AsyncMock` (lifespan не трогает реальный Redis)

Каждый тест получает чистый Redis-стейт.

### `fake_redis` (scope: function)

`fakeredis.aioredis.FakeRedis` для async unit-тестов Redis-сервисов и SSE.

### `redis_container` (scope: session)

`testcontainers.redis.RedisContainer` с паролем `testpassword`. Используется в `tests/redis/test_connection.py` для проверки реального auth.

### `task_session` (scope: function via `db_session`)

`db_session` с нейтрализованным `close()` — позволяет Celery-задачам вызывать `db.close()` без экспанжа объектов до конца теста.

## Стратегии тестирования

### Integration тесты (`tests/integration/`)

Используют реальный PostgreSQL (testcontainers) и fake Redis. Тестируют HTTP-поведение через `client.post(...)`, `client.get(...)` и т.д. Проверяют статус-коды, тела ответов, бизнес-правила.

```python
def test_register_duplicate_email(client):
    client.post("/auth/register/", json={...})
    response = client.post("/auth/register/", json={...})  # тот же email
    assert response.status_code == 400
```

### Redis unit-тесты (`tests/redis/`)

Используют `fake_redis` для тестирования логики сервисов без реального Redis. Исключение — `test_connection.py`, который проверяет реальную аутентификацию через `redis_container`.

```python
async def test_rate_limit_blocks_after_limit(fake_redis):
    service = RateLimitService(fake_redis)
    await service.check("key", limit=1, window=60)
    with pytest.raises(RateLimitExceededError):
        await service.check("key", limit=1, window=60)
```

### Celery task-тесты (`tests/tasks/`)

Задачи вызываются **напрямую** (не через `.delay()`). `SessionLocal` патчится на `task_session`. Delivery-функции и `_dispatch` мокаются через `unittest.mock.patch`.

```python
@pytest.fixture(autouse=True)
def patch_session(task_session):
    with patch("app.tasks.notifications.SessionLocal", return_value=task_session):
        yield task_session

def test_email_channel_calls_send_email(patch_session):
    n = make_notification(patch_session, user.id, channel=NotificationChannel.EMAIL)
    with patch("app.tasks.notifications._send_email") as mock:
        send_notification(str(n.id))
    mock.assert_called_once()
```

## Таблица покрытия

| Файл | Что тестирует | Тестов |
|---|---|---|
| `test_auth.py` | Регистрация, логин, валидация, rate limit | 14 |
| `test_sse.py` | SSE publish, pub/sub, формат сообщений | 9 |
| `test_users_crud.py` | CRUD пользователей | 11 |
| `test_habits_crud.py` | CRUD привычек | 12 |
| `test_goals_crud.py` | CRUD целей | 10 |
| `test_habit_records_crud.py` | CRUD записей привычек | 10 |
| `test_goal_records_crud.py` | CRUD записей целей | 10 |
| `test_notifications_crud.py` | CRUD уведомлений | 10 |
| `test_api_keys_crud.py` | CRUD API-ключей | 10 |
| `test_connection.py` | Redis auth с реальным сервером | 4 |
| `test_cache.py` | CacheService | 10 |
| `test_sessions.py` | SessionService | 8 |
| `test_locks.py` | LockService | 5 |
| `test_rate_limit.py` | RateLimitService | 7 |
| `test_send_notification.py` | send_notification task | 10 |
| `test_periodic.py` | Периодические задачи | 28 |
| **Итого** | | **168** |

## Важные паттерны

**Патч SessionLocal в задачах** (избегает реального подключения):
```python
with patch("app.tasks.notifications.SessionLocal", return_value=task_session):
    send_notification(notification_id)
```

**Патч _dispatch** (не запускает реальный Celery в тестах периодики):
```python
with patch("app.tasks.periodic._dispatch") as mock_dispatch:
    count = check_streaks()
assert mock_dispatch.call_count == expected
```

**Нейтрализация close()** в `task_session` (задачи вызывают `db.close()`, но мы хотим продолжить использовать сессию для проверок):
```python
with patch.object(db_session, "close"):
    yield db_session
```

**SSE-тесты через httpx.AsyncClient** (sync TestClient зависает на бесконечном SSE-генераторе):
```python
async def test_stream_invalid_user_id(override_redis):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), ...) as ac:
        response = await ac.get("/notifications/stream/not-a-uuid")
    assert response.status_code == 422
```
