import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Null,
    Numeric,
    String,
    DateTime,
    Enum as SQLAlchemyEnum,
    Time,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

from models.enums import (
    AuthProvider,
    Periodicity,
    GoalSource,
    NotificationChannel,
    NotificationEvent,
    NotificationStatus,
    LogAction,
)

from models.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(
        String(255), nullable=True
    )  # Nullable для OAuth-пользователей
    auth_provider = Column(
        SQLAlchemyEnum(AuthProvider), nullable=False, default=AuthProvider.LOCAL
    )
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    timezone = Column(String(50), nullable=False, default="UTC")
    locale = Column(String(10), nullable=False, default="en")


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
    target_value = Column(Numeric(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    archived_at = Column(DateTime(timezone=True), nullable=True)


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
    value = Column(Numeric(10, 2), nullable=False, default=1)
    notes = Column(Text, nullable=True)


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
    created_at = Column(Time(timezone=True), nullable=False)
    archived_at = Column(Time(timezone=True), nullable=True)


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
    value = Column(Numeric(255), nullable=False)
    source = Column(
        SQLAlchemyEnum(GoalSource), nullable=False, default=GoalSource.MANUAL
    )


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


class AuditLog(Base):
    __tablename__ = "audit_log"
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
    event = Column(SQLAlchemyEnum(LogAction), nullable=False)
    context = Column(JSONB, nullable=True)
    ip = Column(String(255), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(Time(timezone=True), nullable=False)


class APIKey(Base):
    __tablename__ = "api_keys"

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
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False)
    scopes = Column(JSONB, default=dict)
    expires_at = Column(Time(timezone=True), nullable=True)
    created_at = Column(Time(timezone=True), nullable=False)
    revoked_at = Column(Time(timezone=True), nullable=True)


class Session(Base):
    __tablename__ = "sessions"

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
    refresh_token_hash = Column(String(255))
    ip = Column(String(255))
    user_agent = Column(String(255))
    expires_at = Column(Time(timezone=True), nullable=True)
    created_at = Column(Time(timezone=True), nullable=False)
    revoked_at = Column(Time(timezone=True), nullable=True)
