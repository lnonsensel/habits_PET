import uuid

from sqlalchemy import (
    Column,
    ForeignKey,
    Numeric,
    String,
    DateTime,
    Time,
)
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    habit_id = Column(
        UUID(as_uuid=True), ForeignKey("habits.id", ondelete="CASCADE"), nullable=True
    )
    start_date = Column(
        DateTime(timezone=True),
        nullable=False,
    )
    end_date = Column(
        DateTime(timezone=True),
        nullable=False,
    )
    target_value = Column(Numeric(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    archived_at = Column(Time(timezone=True), nullable=True)
