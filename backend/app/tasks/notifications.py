import logging
from datetime import datetime, timezone

from app.tasks.celery_app import celery_app
from app.core.database import SessionLocal
from app.crud.notifications import notifications_crud
from app.models.enums import NotificationChannel, NotificationStatus
from app.schemas.notifications import NotificationUpdate

logger = logging.getLogger("habitpet.tasks.notifications")


# ── Delivery stubs — replace with real integrations ─────────────

def _send_email(notification) -> None:
    """Plug in SMTP / SendGrid / Mailgun here."""
    logger.info(
        "EMAIL → user_id=%s event=%s payload=%s",
        notification.user_id, notification.event, notification.payload,
    )


def _send_push(notification) -> None:
    """Plug in FCM (Android) / APNs (iOS) here."""
    logger.info(
        "PUSH → user_id=%s event=%s payload=%s",
        notification.user_id, notification.event, notification.payload,
    )


def _send_webhook(notification) -> None:
    """Plug in HTTP POST to notification.payload['url'] here."""
    logger.info(
        "WEBHOOK → user_id=%s event=%s payload=%s",
        notification.user_id, notification.event, notification.payload,
    )


# ── Task ─────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.notifications.send_notification",
    max_retries=3,
    default_retry_delay=60,   # seconds between retries
)
def send_notification(self, notification_id: str) -> None:
    """
    Deliver a single notification via its configured channel.
    Retries up to 3 times with 60-second delays on failure.
    Updates status to SENT / FAILED in the database.
    """
    db = SessionLocal()
    notification = None
    try:
        notification = notifications_crud.get(db, notification_id)
        if not notification:
            logger.warning("Notification %s not found — skipping", notification_id)
            return
        if notification.status == NotificationStatus.SENT:
            return

        match notification.channel:
            case NotificationChannel.EMAIL:
                _send_email(notification)
            case NotificationChannel.PUSH:
                _send_push(notification)
            case NotificationChannel.WEBHOOK:
                _send_webhook(notification)
            case _:
                logger.warning(
                    "Unknown channel %s for notification %s",
                    notification.channel, notification_id,
                )

        notifications_crud.update(
            db,
            id=notification_id,
            obj_in=NotificationUpdate(
                status=NotificationStatus.SENT,
                sent_at=datetime.now(timezone.utc).time(),
            ),
        )
        logger.info("Notification %s sent via %s", notification_id, notification.channel)

    except Exception as exc:
        if notification:
            try:
                notifications_crud.update(
                    db,
                    id=notification_id,
                    obj_in=NotificationUpdate(
                        status=NotificationStatus.FAILED,
                        retry_count=(notification.retry_count or 0) + 1,
                    ),
                )
            except Exception:
                db.rollback()
        logger.error("Failed to send notification %s: %s", notification_id, exc)
        raise self.retry(exc=exc)
    finally:
        db.close()
