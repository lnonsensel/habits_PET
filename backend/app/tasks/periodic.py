import logging
from datetime import datetime, timedelta, timezone

from app.tasks.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.enums import NotificationChannel, NotificationEvent, NotificationStatus, Periodicity
from app.models.habit import Habit
from app.models.habit_record import HabitRecord
from app.models.notification import Notification
from app.models.user import User
from app.core.metrics import habits_active, users_total_gauge

logger = logging.getLogger("habitpet.tasks.periodic")


def _dispatch(notification_id: str) -> None:
    from app.tasks.notifications import send_notification
    send_notification.delay(notification_id)


def _make_notification(user_id, event, payload=None) -> Notification:
    return Notification(
        user_id=user_id,
        channel=NotificationChannel.EMAIL,
        event=event,
        payload=payload or {},
        status=NotificationStatus.PENDING,
        scheduled_at=datetime.now(timezone.utc).time(),
    )


# ── Streak check ─────────────────────────────────────────────────

@celery_app.task(name="app.tasks.periodic.check_streaks")
def check_streaks() -> int:
    """
    For each active daily habit: if no record was logged yesterday →
    create a STREAK_LOST notification and dispatch immediately.
    """
    db = SessionLocal()
    created = 0
    try:
        now_utc = datetime.now(timezone.utc)
        yesterday_start = (now_utc - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0,
        )
        yesterday_end = yesterday_start + timedelta(days=1)

        daily_habits = (
            db.query(Habit)
            .filter(Habit.periodicity == Periodicity.DAILY, Habit.archived_at.is_(None))
            .all()
        )

        for habit in daily_habits:
            had_record = db.query(HabitRecord).filter(
                HabitRecord.habit_id == habit.id,
                HabitRecord.timestamp >= yesterday_start,
                HabitRecord.timestamp < yesterday_end,
            ).first()

            if not had_record:
                n = _make_notification(
                    habit.user_id,
                    NotificationEvent.STREAK_LOST,
                    {"habit_id": str(habit.id), "habit_name": habit.name},
                )
                db.add(n)
                db.flush()
                _dispatch(str(n.id))
                created += 1

        db.commit()
        logger.info("check_streaks: %d STREAK_LOST notifications created", created)
        return created
    except Exception as exc:
        db.rollback()
        logger.error("check_streaks failed: %s", exc)
        raise
    finally:
        db.close()


# ── Daily reminders ───────────────────────────────────────────────

@celery_app.task(name="app.tasks.periodic.send_daily_reminders")
def send_daily_reminders() -> int:
    """
    Create a DAILY_REMAINDER notification for every user with at least
    one active daily habit. Dispatches immediately.
    """
    db = SessionLocal()
    created = 0
    try:
        users = (
            db.query(User)
            .join(Habit, Habit.user_id == User.id)
            .filter(Habit.periodicity == Periodicity.DAILY, Habit.archived_at.is_(None))
            .distinct()
            .all()
        )

        for user in users:
            n = _make_notification(user.id, NotificationEvent.DAILY_REMAINDER)
            db.add(n)
            db.flush()
            _dispatch(str(n.id))
            created += 1

        db.commit()
        logger.info("send_daily_reminders: %d notifications created", created)
        return created
    except Exception as exc:
        db.rollback()
        logger.error("send_daily_reminders failed: %s", exc)
        raise
    finally:
        db.close()


# ── Weekly summary ────────────────────────────────────────────────

@celery_app.task(name="app.tasks.periodic.send_weekly_summary")
def send_weekly_summary() -> int:
    """
    Create a SUMMARY_WEEKLY notification for every user with active habits.
    """
    db = SessionLocal()
    created = 0
    try:
        users = (
            db.query(User)
            .join(Habit, Habit.user_id == User.id)
            .filter(Habit.archived_at.is_(None))
            .distinct()
            .all()
        )

        for user in users:
            n = _make_notification(user.id, NotificationEvent.SUMMARY_WEEKLY)
            db.add(n)
            db.flush()
            _dispatch(str(n.id))
            created += 1

        db.commit()
        logger.info("send_weekly_summary: %d notifications created", created)
        return created
    except Exception as exc:
        db.rollback()
        logger.error("send_weekly_summary failed: %s", exc)
        raise
    finally:
        db.close()


# ── Cleanup ───────────────────────────────────────────────────────

@celery_app.task(name="app.tasks.periodic.cleanup_notifications")
def cleanup_notifications() -> int:
    """
    Delete SENT notifications.
    Note: created_at is stored as Time (not DateTime), so date-based filtering
    is not reliable — deletes all SENT as best-effort cleanup.
    A DateTime migration would enable retention-period logic (e.g. > 30 days).
    """
    db = SessionLocal()
    try:
        deleted = (
            db.query(Notification)
            .filter(Notification.status == NotificationStatus.SENT)
            .delete(synchronize_session=False)
        )
        db.commit()
        logger.info("cleanup_notifications: %d records deleted", deleted)
        return deleted
    except Exception as exc:
        db.rollback()
        logger.error("cleanup_notifications failed: %s", exc)
        raise
    finally:
        db.close()


# ── Business metrics refresh ──────────────────────────────────────

@celery_app.task(name="app.tasks.periodic.refresh_business_metrics")
def refresh_business_metrics() -> dict:
    """Update Prometheus gauges with current DB counts."""
    db = SessionLocal()
    try:
        active_count = db.query(Habit).filter(Habit.archived_at.is_(None)).count()
        users_count = db.query(User).count()
        habits_active.set(active_count)
        users_total_gauge.set(users_count)
        logger.info("refresh_business_metrics: habits_active=%d users=%d", active_count, users_count)
        return {"habits_active": active_count, "users_total": users_count}
    except Exception as exc:
        logger.error("refresh_business_metrics failed: %s", exc)
        raise
    finally:
        db.close()


# ── Fallback dispatcher ───────────────────────────────────────────

@celery_app.task(name="app.tasks.periodic.dispatch_pending_notifications")
def dispatch_pending_notifications() -> int:
    """
    Catches any PENDING notifications that were not dispatched immediately
    (e.g. Celery was unavailable when the record was created).
    Runs every 60 seconds via Celery Beat.
    """
    db = SessionLocal()
    try:
        pending = (
            db.query(Notification)
            .filter(
                Notification.status == NotificationStatus.PENDING,
                Notification.retry_count < 3,
            )
            .limit(100)
            .all()
        )

        for n in pending:
            _dispatch(str(n.id))

        if pending:
            logger.info("dispatch_pending: queued %d notifications", len(pending))
        return len(pending)
    except Exception as exc:
        logger.error("dispatch_pending failed: %s", exc)
        raise
    finally:
        db.close()
