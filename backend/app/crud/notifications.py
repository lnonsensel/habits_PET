from app.crud.base import CRUDBase

from app.models.notification import Notification
from app.schemas.notifications import NotificationCreate, NotificationUpdate


class NotificationCRUD(CRUDBase[Notification, NotificationCreate, NotificationUpdate]):
    pass


notifications_crud = NotificationCRUD(Notification)
