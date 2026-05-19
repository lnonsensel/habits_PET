# API Reference

**Base URL:** `http://localhost:3000`  
**Документация:** `GET /docs` (Swagger UI) · `GET /redoc` (ReDoc)  
**Content-Type:** `application/json`

---

## System

### `GET /health`

Проверка работоспособности сервиса.

**Ответ `200`:**
```json
{ "status": "ok", "timestamp": "2026-05-18T12:00:00.000Z" }
```

### `GET /health/db`

Проверка соединения с PostgreSQL.

**Ответ `200`:**
```json
{ "status": "ok", "database": "connected" }
```

---

## Authentication

### `POST /auth/register/`

Регистрация нового пользователя.

**Rate limit:** 5 запросов за 10 минут с одного IP.

**Тело запроса:**

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `email` | string (email) | ✅ | Email-адрес |
| `password` | string (8–100 символов) | Для local | Пароль (не нужен для OAuth) |
| `auth_provider` | `local` \| `google` \| `github` | ✅ | Способ авторизации |
| `timezone` | string | — | Часовой пояс (default: `UTC`) |
| `locale` | string | — | Язык (default: `en`) |

**Ответ `201`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "auth_provider": "local",
  "timezone": "Europe/Moscow",
  "locale": "ru",
  "created_at": "2026-05-18T12:00:00Z",
  "updated_at": "2026-05-18T12:00:00Z",
  "last_login_at": null
}
```

**Коды ошибок:** `400` дубликат email, `422` ошибка валидации, `429` rate limit.

```bash
curl -X POST http://localhost:3000/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123","auth_provider":"local"}'
```

---

### `POST /auth/login/`

Вход в систему.

**Rate limit:** 10 запросов за 1 минуту с одного IP.

**Тело запроса:**

| Поле | Тип | Описание |
|---|---|---|
| `email` | string (email) | Email-адрес |
| `password` | string | Пароль |

**Ответ `200`:** `UserResponse` (см. выше)  
**Коды ошибок:** `401` неверные данные, `429` rate limit.

---

## CRUD Resources

Все 7 ресурсов используют единый шаблон, сгенерированный `create_crud_router()`.

### Общие параметры GET-списка

| Параметр | Тип | Default | Описание |
|---|---|---|---|
| `skip` | int | 0 | Смещение (pagination) |
| `limit` | int | 1000 | Максимум записей |
| `user_id` | UUID | — | Фильтр по пользователю |
| `habit_id` | UUID | — | Фильтр по привычке (для habit_records) |
| `goal_id` | UUID | — | Фильтр по цели (для goal_records) |

### Коды ответов

| Код | Описание |
|---|---|
| `200` | Успех |
| `201` | Создано |
| `404` | Не найдено |
| `409` | Конфликт (дубликат) |
| `422` | Ошибка валидации |

---

### Users `/users`

```bash
# Создать пользователя
curl -X POST http://localhost:3000/users/ \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"pass1234","auth_provider":"local"}'

# Список пользователей
curl "http://localhost:3000/users/?limit=10"

# Получить пользователя
curl http://localhost:3000/users/{id}

# Обновить
curl -X PUT http://localhost:3000/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"timezone":"Europe/Moscow","locale":"ru"}'

# Удалить
curl -X DELETE http://localhost:3000/users/{id}
```

**UserCreate:** `email`, `password` (opt), `auth_provider`, `timezone` (opt), `locale` (opt)  
**UserUpdate:** `email` (opt), `password` (opt), `timezone` (opt), `locale` (opt)

---

### Habits `/habits`

```bash
# Создать привычку
curl -X POST http://localhost:3000/habits/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","name":"Morning run","unit":"km","periodicity":"daily","target_value":5}'

# Список привычек пользователя
curl "http://localhost:3000/habits/?user_id=<uuid>"
```

**HabitCreate:**

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `user_id` | UUID | ✅ | Владелец |
| `name` | string | ✅ | Название (max 255) |
| `unit` | string | ✅ | Единица измерения |
| `periodicity` | enum | — | `daily`/`weekly`/`monthly` (default: `daily`) |
| `description` | string | — | Описание |
| `target_value` | int | — | Целевое значение |

**HabitResponse** добавляет: `id`, `created_at`, `archived_at`.

---

### Habit Records `/habit_records`

```bash
curl -X POST http://localhost:3000/habit_records/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","habit_id":"<uuid>","value":5,"notes":"Felt good"}'

curl "http://localhost:3000/habit_records/?user_id=<uuid>&habit_id=<uuid>"
```

**HabitRecordCreate:** `user_id`, `habit_id`, `value` (int), `notes` (opt)  
**HabitRecordUpdate:** `value` (opt), `notes` (opt)  
**HabitRecordResponse** добавляет: `id`, `timestamp`

---

### Goals `/goals`

```bash
curl -X POST http://localhost:3000/goals/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","name":"Run 100km","start_date":"2026-01-01T00:00:00Z","end_date":"2026-12-31T00:00:00Z","target_value":100}'
```

**GoalCreate:** `user_id`, `name`, `start_date`, `end_date`, `description` (opt), `habit_id` (opt), `target_value` (opt)

---

### Goal Records `/goal_records`

```bash
curl -X POST http://localhost:3000/goal_records/ \
  -H "Content-Type: application/json" \
  -d '{"goal_id":"<uuid>","value":10,"source":"manual"}'

curl "http://localhost:3000/goal_records/?goal_id=<uuid>"
```

**GoalRecordCreate:** `goal_id`, `value`, `source` (`manual`/`habit_auto`/`api`)

---

### Notifications `/notifications`

```bash
curl -X POST http://localhost:3000/notifications/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","channel":"email","event":"daily_remainder","scheduled_at":"08:00:00"}'

curl "http://localhost:3000/notifications/?user_id=<uuid>"
```

При создании уведомления автоматически ставится Celery-задача `send_notification.delay()`.

**NotificationCreate:**

| Поле | Тип | Описание |
|---|---|---|
| `user_id` | UUID | Получатель |
| `channel` | enum | `email` / `push` / `webhook` |
| `event` | enum | `goal_completed` / `daily_remainder` / `streak_lost` / `summary_weekly` |
| `scheduled_at` | time | Время отправки (только время суток) |
| `payload` | object | Произвольные данные |

**NotificationUpdate:** `status`, `sent_at`, `retry_count`

---

### API Keys `/api_keys`

```bash
# Создать ключ
curl -X POST http://localhost:3000/api_keys/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","name":"My App Key","scopes":{"read":true}}'
```

> Сам ключ возвращается **только при создании** в поле `key`. Храните его — повторно не получить.

**APIKeyCreate:** `user_id`, `name`, `scopes` (dict, opt), `expires_at` (time, opt)  
**APIKeyCreatedResponse** добавляет: `id`, `user_id`, `created_at`, `revoked_at`, **`key`** (только здесь!)

---

## Real-Time (SSE)

### `GET /notifications/stream/{user_id}`

Открывает Server-Sent Events стрим для пользователя.

**Content-Type:** `text/event-stream`

**Заголовки ответа:**

| Заголовок | Значение |
|---|---|
| `Cache-Control` | `no-cache` |
| `Connection` | `keep-alive` |
| `X-Accel-Buffering` | `no` |

**Формат событий:**

```
data: {"event":"goal_completed","payload":{"goal_id":"..."}}\n\n

: keepalive\n\n   ← каждые 30 секунд
```

**Типы событий:**

| Событие | Описание |
|---|---|
| `goal_completed` | Цель выполнена |
| `daily_remainder` | Ежедневное напоминание |
| `streak_lost` | Серия прервалась |
| `summary_weekly` | Еженедельный отчёт |

```bash
curl -N "http://localhost:3000/notifications/stream/<user-uuid>"
```

---

### `POST /notifications/publish`

Публикует уведомление в SSE-стрим пользователя без сохранения в БД.

**Тело:**

| Поле | Тип | Описание |
|---|---|---|
| `user_id` | UUID | Получатель |
| `event` | enum | Тип события |
| `payload` | object | Произвольные данные (default: `{}`) |

**Ответ:** `204 No Content`

```bash
curl -X POST http://localhost:3000/notifications/publish \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","event":"streak_lost","payload":{"habit":"Morning run"}}'
```

---

## Admin Panel

Все эндпоинты требуют **HTTP Basic Auth** (credentials из `.admin.env`).

```bash
curl -u admin:password http://localhost:3000/admin/stats
```

### `GET /admin/stats`

**Ответ `200`:**
```json
{
  "users_total": 150,
  "users_active_today": 23,
  "habits_total": 380,
  "records_today": 156,
  "notifications_pending": 12,
  "notifications_failed": 3
}
```

---

### `GET /admin/users`

| Параметр | Тип | Описание |
|---|---|---|
| `skip` | int | Смещение |
| `limit` | int | Максимум (default 50) |
| `search` | string | Поиск по email (ILIKE) |

**Ответ `200`:**
```json
[{
  "id": "<uuid>",
  "email": "user@example.com",
  "auth_provider": "local",
  "created_at": "2026-01-01T00:00:00Z",
  "last_login_at": "2026-05-18T10:00:00Z",
  "habits_count": 5
}]
```

---

### `DELETE /admin/users/{user_id}`

Удаляет пользователя и все связанные данные (каскадное удаление).

**Ответ:** `204 No Content`

---

### `GET /admin/notifications`

| Параметр | Значения | Описание |
|---|---|---|
| `filter_status` | `all`, `pending`, `sent`, `failed` | Фильтр по статусу |
| `skip` | int | Смещение |
| `limit` | int | Максимум (default 50) |

---

### `POST /admin/notifications/{notification_id}/retry`

Переводит уведомление в статус PENDING (retry_count = 0) и ставит в Celery-очередь.

**Ответ:** `204 No Content`

---

### `GET /admin/habits`

| Параметр | Описание |
|---|---|
| `search` | Поиск по email пользователя |
| `skip`, `limit` | Пагинация |

**Ответ** включает: `id`, `user_email`, `name`, `periodicity`, `target_value`, `records_count`, `created_at`

---

### `GET /admin/logs`

| Параметр | Значения | Описание |
|---|---|---|
| `filter_event` | `all`, `habit_created`, `record_added`, `login`, `api_call` | Фильтр |
| `skip`, `limit` | — | Пагинация |

**Ответ** включает: `id`, `user_email`, `event`, `context`, `ip`, `created_at`

---

### `GET /admin/metrics-summary`

Текущие значения Prometheus-метрик из registry Python-процесса. Данные накапливаются с момента последнего перезапуска backend.

**Ответ `200`:**
```json
{
  "http_total": 1523,
  "http_by_status": {
    "2xx": 1490,
    "3xx": 8,
    "4xx": 23,
    "5xx": 2
  },
  "avg_latency_ms": 34.7,
  "crud_ops": {
    "habits":        { "create": 18, "update": 5,  "delete": 2  },
    "habit_records": { "create": 310, "update": 0, "delete": 12 },
    "users":         { "create": 8,  "update": 1,  "delete": 0  }
  },
  "habits_active": 42,
  "users_total": 10,
  "top_endpoints": [
    { "handler": "/api/habits/",        "count": 540 },
    { "handler": "/api/habit-records/", "count": 312 },
    { "handler": "/auth/login/",        "count": 89  }
  ]
}
```

| Поле | Описание |
|---|---|
| `http_total` | Всего HTTP-запросов с запуска процесса |
| `http_by_status` | Разбивка по классу статус-кода (2xx / 3xx / 4xx / 5xx) |
| `avg_latency_ms` | Средняя задержка (мс) по всем запросам, `null` если запросов не было |
| `crud_ops` | CRUD-операции по таблицам: `create`, `update`, `delete` |
| `habits_active` | Текущее количество активных привычек (Gauge, обновляется каждые 30с) |
| `users_total` | Текущее количество пользователей (Gauge, обновляется каждые 30с) |
| `top_endpoints` | Топ-8 эндпоинтов по количеству запросов |

```bash
curl -u admin:password http://localhost:3000/api/admin/metrics-summary
```
