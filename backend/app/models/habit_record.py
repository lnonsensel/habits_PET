import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    Numeric,
    Time,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class HabitRecord(Base):
    __tablename__ = "habit_records"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    habit_id = Column(
        UUID(as_uuid=True),
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    timestamp = Column(Time(timezone=True), nullable=False, server_default=func.now())
    value = Column(Numeric(12), nullable=False, default=1)
    notes = Column(Text, nullable=True)
