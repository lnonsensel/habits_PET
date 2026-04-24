import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    Numeric,
    Enum as SQLAlchemyEnum,
    Time,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.enums import (
    GoalSource,
)

from app.core.database import Base


class GoalRecord(Base):
    __tablename__ = "goal_records"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        default=uuid.uuid4,
    )
    goal_id = Column(
        UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(Time(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    value = Column(Numeric(255), nullable=False)
    source = Column(
        SQLAlchemyEnum(GoalSource), nullable=False, default=GoalSource.MANUAL
    )
