import logging

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.notification import Notification
from app.schemas.notifications import NotificationCreate, NotificationUpdate

logger = logging.getLogger("habitpet.crud.notifications")


class NotificationCRUD(CRUDBase[Notification, NotificationCreate, NotificationUpdate]):
    def create(self, db: Session, obj_in: NotificationCreate) -> Notification:
        notification = super().create(db, obj_in)
        self._dispatch(str(notification.id))
        return notification

    @staticmethod
    def _dispatch(notification_id: str) -> None:
        """
        Trigger async delivery. Lazy import avoids a circular dependency
        (tasks.notifications → crud.notifications → tasks.notifications).
        Silently skips if Celery is unavailable (e.g. in tests or local dev).
        """
        try:
            from app.tasks.notifications import send_notification
            send_notification.delay(notification_id)
        except Exception as exc:
            logger.warning("Could not dispatch notification %s: %s", notification_id, exc)


notifications_crud = NotificationCRUD(Notification)
