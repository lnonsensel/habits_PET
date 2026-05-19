# Background Tasks (Celery)

## Архитектура

```
FastAPI
  │
  └──► NotificationCRUD.create()
           │
           └──► send_notification.delay(id)   ← ставит задачу в очередь
                        │
                        ▼
               Redis db/1 (Broker)
                        │
                        ▼
               Celery Worker (×4)
                        │
                        └──► _send_email / _send_push / _send_webhook
                        └──► UPDATE notifications SET status='sent'

Celery Beat (scheduler, одна реплика)
  │
  ├── 07:00 UTC → check_streaks.delay()
  ├── 08:00 UTC → send_daily_reminders.delay()
  ├── Sun 09:00 → send_weekly_summary.delay()
  ├── 03:00 UTC → cleanup_notifications.delay()
  └── каждые 60s → dispatch_pending_notifications.delay()
```

**Redis DB-индексы:**

| База | Использование |
|---|---|
| `db/1` | Broker — очередь задач Celery |
| `db/2` | Result backend — результаты и статусы задач |

## Запуск

```bash
# Worker (выполняет задачи)
celery -A app.tasks.celery_app:celery_app worker --loglevel=info --concurrency=4

# Beat (планировщик, только одна реплика!)
celery -A app.tasks.celery_app:celery_app beat --loglevel=info

# Мониторинг (если установлен flower)
celery -A app.tasks.celery_app:celery_app flower
```

В Docker Compose оба сервиса (`celery_worker`, `celery_beat`) поднимаются автоматически.

## Расписание Celery Beat

| Задача | Расписание | Описание |
|---|---|---|
| `check_streaks` | Каждый день 07:00 UTC | Найти ежедневные привычки без записи за вчера → STREAK_LOST |
| `send_daily_reminders` | Каждый день 08:00 UTC | DAILY_REMAINDER для каждого пользователя с daily-привычками |
| `send_weekly_summary` | Каждое воскресенье 09:00 UTC | SUMMARY_WEEKLY для пользователей с любыми активными привычками |
| `cleanup_notifications` | Каждый день 03:00 UTC | Удалить все SENT-уведомления из БД |
| `dispatch_pending_notifications` | Каждые 60 секунд | Fallback: диспатчить PENDING с retry_count < 3 |
| `refresh_business_metrics` | Каждые 30 секунд | Обновить Prometheus Gauge-метрики из БД |

## Задачи

### `send_notification(notification_id: str)`

**Файл:** `app/tasks/notifications.py`

Доставляет одно уведомление по ID. Вызывается немедленно при создании записи в БД и как fallback каждые 60 секунд через `dispatch_pending_notifications`.

```
1. Загрузить Notification из БД
2. Если status == SENT → вернуть (идемпотентность)
3. Если не найдено → вернуть
4. Dispatch по channel:
   - EMAIL   → _send_email(notification)    [заглушка]
   - PUSH    → _send_push(notification)     [заглушка]
   - WEBHOOK → _send_webhook(notification)  [заглушка]
5. UPDATE status=SENT, sent_at=now()
6. При исключении: UPDATE status=FAILED, retry_count++, self.retry()
```

**Параметры Celery:**

| Параметр | Значение |
|---|---|
| `bind=True` | Доступ к `self` для retry |
| `max_retries` | 3 |
| `default_retry_delay` | 60 секунд |

### `check_streaks() → int`

**Файл:** `app/tasks/periodic.py`

Проверяет, есть ли запись за вчера для каждой активной ежедневной привычки. Если нет — создаёт STREAK_LOST уведомление и немедленно диспатчит.

```python
yesterday = [yesterday 00:00 UTC .. yesterday 24:00 UTC)

for habit in Habit.filter(periodicity=DAILY, archived_at=None):
    if not HabitRecord.filter(habit_id=habit.id, timestamp in yesterday):
        n = Notification(event=STREAK_LOST, payload={habit_id, habit_name})
        send_notification.delay(n.id)
```

**Возвращает:** количество созданных уведомлений.

### `send_daily_reminders() → int`

Создаёт одно DAILY_REMAINDER уведомление на каждого пользователя с хотя бы одной активной ежедневной привычкой (один пользователь = одно уведомление, даже если привычек несколько).

### `send_weekly_summary() → int`

Создаёт одно SUMMARY_WEEKLY уведомление на каждого пользователя с хотя бы одной активной привычкой любой периодичности.

### `cleanup_notifications() → int`

Удаляет из БД все уведомления со `status=PENDING`. Запускается ночью (03:00 UTC).

> ⚠️ Из-за того что `created_at` имеет тип `Time` а не `DateTime`, фильтрация по возрасту записи невозможна. Очищаются ВСЕ SENT-записи. После миграции `created_at → DateTime` можно добавить условие `created_at < now() - 30 days`.

### `dispatch_pending_notifications() → int`

Fallback-задача: запускается каждые 60 секунд и диспатчит PENDING уведомления с `retry_count < 3`. Покрывает случай, когда `send_notification.delay()` не смог положить задачу в Celery (например, Redis временно недоступен в момент создания уведомления).

### `refresh_business_metrics() → dict`

**Файл:** `app/tasks/periodic.py`

Запрашивает актуальные счётчики из PostgreSQL и выставляет Prometheus Gauge-метрики. Запускается каждые 30 секунд через Celery Beat.

```
habits_active = COUNT(habits WHERE archived_at IS NULL)
users_total   = COUNT(users)

habitpet_habits_active_total.set(habits_active)
habitpet_users_total.set(users_total)
```

**Возвращает:** `{"habits_active": int, "users_total": int}`

> Gauge-метрики не хранятся в Redis — они живут только в памяти Python-процесса. При перезапуске backend задача заполнит их в течение 30 секунд.

## Delivery-заглушки

Функции `_send_email`, `_send_push`, `_send_webhook` в `app/tasks/notifications.py` сейчас только логируют. Для реальной доставки нужно заменить их тело:

| Канал | Что добавить |
|---|---|
| `_send_email` | SMTP через `aiosmtplib` / SendGrid SDK / Mailgun API |
| `_send_push` | Firebase Cloud Messaging (FCM) / APNs |
| `_send_webhook` | `httpx.post(notification.payload['url'], json=...)` |

## Dispatch flow

```
POST /notifications/       ← HTTP запрос
  │
  ├── notifications_crud.create(db, obj_in)   ← запись в PostgreSQL
  │
  └── _dispatch(notification.id)
        │
        ├── try:
        │     send_notification.delay(id)     ← Redis Broker db/1
        └── except:
              pass  ← не падаем, если Celery недоступен


dispatch_pending_notifications (каждые 60с) ← подхватывает всё не задиспатченное
```

## Мониторинг задач

```bash
# Список активных задач
celery -A app.tasks.celery_app:celery_app inspect active

# Статистика воркеров
celery -A app.tasks.celery_app:celery_app inspect stats

# Принудительный запуск задачи
celery -A app.tasks.celery_app:celery_app call app.tasks.periodic.check_streaks
```
