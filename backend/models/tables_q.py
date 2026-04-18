from typing import Text
import uuid
from enum import Enum
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
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class AuthProvider(Enum):
    LOCAL = "local"
    GOOGLE = "google"
    GITHUB = "github"


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


class Periodicity(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


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
    archived_at = Column(DateTime(timezone=True), nullable=True, server_default=Null())


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
    value = Column(Numeric(255), nullable=False, default=1)
    notes = Column(Text(255), nullable=True)


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


class GoalSource(Enum):
    MANUAL = "manual"
    HABIT_AUTO = "habit-auto"
    API = "api"


class GoalRecord(Base):
    __tablename__ = "goal_records"
    id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    goal_id = Column(
        UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(Time(timezone=True), nullable=False, server_default=func.now())
    value = Column(Numeric(255), nullable=False)
    source = Column(
        SQLAlchemyEnum(GoalSource), nullable=False, default=GoalSource.MANUAL
    )


class NotificationChannel(Enum):
    EMAIL = "email"
    PUSH = "push"
    WEBHOOK = "webhook"


class NotificationEvent(Enum):
    GOAL_COMPLETED = "goal_completed"
    DAILY_REMAINDER = "daily_remainder"
    STREAK_LOST = "streak_lost"
    SUMMARY_WEEKLY = "summary_weekly"


class NotificationStatus(Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)

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


class LogAction(Enum):
    HABIT_CREATED = "habit_created"
    RECORD_ADDED = "record_added"
    LOGIN = "login"
    API_CALL = "api_call"


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
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

    id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
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

    id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    refresh_token_hash = Column(String(255))
    ip = Column(String(255))
    user_agent = Column(String(255))
    expires_at = Column(Time(timezone=True), nullable=True)
    created_at = Column(Time(timezone=True), nullable=False)
    revoked_at = Column(Time(timezone=True), nullable=True)
