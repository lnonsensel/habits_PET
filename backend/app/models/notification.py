import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Enum as SQLAlchemyEnum,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from models.enums import (
    NotificationChannel,
    NotificationEvent,
    NotificationStatus,
)

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        default=uuid.uuid4,
    )

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    channel = Column(SQLAlchemyEnum(NotificationChannel), nullable=False)

    event = Column(SQLAlchemyEnum(NotificationEvent), nullable=False)
    payload = Column(JSONB, nullable=True)
    status = Column(SQLAlchemyEnum(NotificationStatus), nullable=False)
    scheduled_at = Column(
        Time(timezone=True),
        nullable=False,
    )
    sent_at = Column(
        Time(timezone=True),
        nullable=True,
    )
    retry_count = Column(Integer(), default=0)
    created_at = Column(Time(), server_default=func.now())
