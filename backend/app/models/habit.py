import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    Numeric,
    String,
    DateTime,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.enums import (
    Periodicity,
)

from app.core.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(String(255), unique=False, nullable=False)
    description = Column(String(255), unique=False, nullable=True)
    unit = Column(String(255), unique=False, nullable=False)
    periodicity = Column(
        SQLAlchemyEnum(Periodicity), nullable=False, default=Periodicity.DAILY
    )
    target_value = Column(Numeric(12), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    archived_at = Column(DateTime(timezone=True), nullable=True)
