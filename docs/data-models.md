# Data Models

## ER-диаграмма

```
┌──────────┐         ┌──────────┐         ┌──────────────┐
│   User   │──1:N───►│  Habit   │──1:N───►│ HabitRecord  │
│          │         │          │          │              │
│          │──1:N───►│  Goal    │──1:N───►│  GoalRecord  │
│          │         │(habit_id?│          │              │
│          │──1:N───►│  notif.  │          └──────────────┘
│          │──1:N───►│ APIKey   │
│          │──1:N───►│ Session  │
│          │──1:N───►│AuditLog  │
└──────────┘         └──────────┘
```

Все FK используют `ondelete=CASCADE` — удаление User удаляет все связанные записи.

---

## User

**Таблица:** `users`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK, default uuid4 | Уникальный идентификатор |
| `email` | String(255) | UNIQUE, NOT NULL | Email-адрес (логин) |
| `password_hash` | String(255) | nullable | Хеш пароля bcrypt; NULL для OAuth-пользователей |
| `auth_provider` | Enum | NOT NULL, default LOCAL | Способ входа |
| `created_at` | DateTime(tz) | NOT NULL, server_default=now() | Дата регистрации |
| `updated_at` | DateTime(tz) | NOT NULL, onupdate=now() | Дата последнего изменения |
| `last_login_at` | DateTime(tz) | nullable | Дата последнего входа |
| `timezone` | String(50) | NOT NULL, default "UTC" | Часовой пояс пользователя |
| `locale` | String(10) | NOT NULL, default "en" | Язык интерфейса |

---

## Habit

**Таблица:** `habits`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `user_id` | UUID | FK → users.id | Владелец |
| `name` | String(255) | NOT NULL | Название привычки |
| `description` | String(255) | nullable | Описание |
| `unit` | String(255) | NOT NULL | Единица измерения (км, раз, мин) |
| `periodicity` | Enum | NOT NULL, default DAILY | Частота |
| `target_value` | Numeric(12) | nullable | Целевое значение за период |
| `created_at` | DateTime(tz) | NOT NULL, server_default=now() | |
| `archived_at` | DateTime(tz) | nullable | Дата архивации (мягкое удаление) |

---

## HabitRecord

**Таблица:** `habit_records`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `habit_id` | UUID | FK → habits.id | Привычка |
| `user_id` | UUID | FK → users.id | Пользователь |
| `timestamp` | DateTime(tz) | NOT NULL, server_default=now() | Время выполнения |
| `value` | Numeric(12) | NOT NULL, default 1 | Зафиксированное значение |
| `notes` | Text | nullable | Заметка |

---

## Goal

**Таблица:** `goals`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `user_id` | UUID | FK → users.id | Владелец |
| `name` | String(255) | NOT NULL | Название цели |
| `description` | String(255) | nullable | Описание |
| `habit_id` | UUID | FK → habits.id, nullable | Связанная привычка (опционально) |
| `start_date` | DateTime(tz) | NOT NULL | Начало периода цели |
| `end_date` | DateTime(tz) | NOT NULL | Конец периода цели |
| `target_value` | Numeric(255) | nullable | Целевое значение |
| `created_at` | DateTime(tz) | NOT NULL, server_default=now() | |
| `archived_at` | Time(tz) | nullable | ⚠️ Тип Time (не DateTime) |

---

## GoalRecord

**Таблица:** `goal_records`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `goal_id` | UUID | FK → goals.id | Цель |
| `value` | Numeric(255) | NOT NULL | Зафиксированное значение |
| `source` | Enum | NOT NULL, default MANUAL | Источник записи |
| `created_at` | DateTime(tz) | NOT NULL, server_default=now() | |
| `updated_at` | DateTime(tz) | NOT NULL, onupdate=now() | |

---

## Notification

**Таблица:** `notifications`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `user_id` | UUID | FK → users.id | Получатель |
| `channel` | Enum | NOT NULL | Канал доставки |
| `event` | Enum | NOT NULL | Тип события |
| `payload` | JSONB | nullable | Произвольные данные события |
| `status` | Enum | NOT NULL, default PENDING | Статус доставки |
| `scheduled_at` | Time(tz) | NOT NULL | ⚠️ Тип Time (не DateTime) |
| `sent_at` | Time(tz) | nullable | ⚠️ Тип Time (не DateTime) |
| `retry_count` | Integer | default 0 | Количество попыток доставки |
| `created_at` | Time() | server_default=now() | ⚠️ Тип Time (не DateTime) |

---

## APIKey

**Таблица:** `api_keys`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `user_id` | UUID | FK → users.id | Владелец |
| `name` | String(255) | NOT NULL | Название ключа |
| `key_hash` | String(255) | NOT NULL | SHA-256 хеш ключа |
| `scopes` | JSONB | default {} | Права доступа |
| `expires_at` | Time(tz) | nullable | ⚠️ Тип Time (не DateTime) |
| `created_at` | Time(tz) | server_default=now() | ⚠️ Тип Time (не DateTime) |
| `revoked_at` | Time(tz) | nullable | ⚠️ Тип Time (не DateTime) |

---

## AuditLog

**Таблица:** `audit_log`

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | UUID | PK | Идентификатор |
| `user_id` | UUID | FK → users.id | Пользователь |
| `event` | Enum | NOT NULL | Тип действия |
| `context` | JSONB | nullable | Контекст события |
| `ip` | String(255) | nullable | IP-адрес |
| `user_agent` | String(255) | nullable | User-Agent |
| `created_at` | Time(tz) | NOT NULL | ⚠️ Тип Time (не DateTime) |

---

## Enum-ы

### AuthProvider
| Значение | Описание |
|---|---|
| `local` | Локальный email/пароль |
| `google` | OAuth через Google |
| `github` | OAuth через GitHub |

### Periodicity
| Значение | Описание |
|---|---|
| `daily` | Ежедневная привычка |
| `weekly` | Еженедельная |
| `monthly` | Ежемесячная |

### NotificationChannel
| Значение | Описание |
|---|---|
| `email` | Доставка по email |
| `push` | Push-уведомление (FCM/APNs) |
| `webhook` | HTTP POST на внешний URL |

### NotificationEvent
| Значение | Описание |
|---|---|
| `goal_completed` | Цель выполнена |
| `daily_remainder` | Ежедневное напоминание |
| `streak_lost` | Серия прервалась |
| `summary_weekly` | Еженедельный отчёт |

### NotificationStatus
| Значение | Описание |
|---|---|
| `pending` | Ожидает отправки |
| `sent` | Успешно отправлено |
| `failed` | Ошибка доставки |

### GoalSource
| Значение | Описание |
|---|---|
| `manual` | Введено вручную |
| `habit_auto` | Автоматически из HabitRecord |
| `api` | Через API |

### LogAction
| Значение | Описание |
|---|---|
| `habit_created` | Создание привычки |
| `record_added` | Добавление записи |
| `login` | Вход в систему |
| `api_call` | Вызов API |

---

## Известные ограничения

> ⚠️ Несколько моделей используют тип `Time` (только время суток) вместо `DateTime` (дата + время). Это означает, что:
> - Нельзя фильтровать по диапазону дат
> - `cleanup_notifications` удаляет все SENT записи, а не только старше N дней
> - Поля `expires_at` и `created_at` в APIKey, Session не хранят дату
>
> Затронутые поля: `Goal.archived_at`, `Notification.scheduled_at/sent_at/created_at`, `APIKey.expires_at/created_at/revoked_at`, `AuditLog.created_at`, `Session.created_at/expires_at/revoked_at`.
>
> Исправление требует Alembic-миграции: `ALTER COLUMN ... TYPE TIMESTAMP WITH TIME ZONE`.
