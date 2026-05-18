"""
Shared fixtures and helpers for Celery task tests.

Tasks use SessionLocal() directly (not FastAPI dependency injection),
so tests patch the SessionLocal name in each task module and proxy
to the test db_session. Session.close() is mocked to prevent premature
expunge — the transaction fixture handles cleanup on teardown.
"""
from contextlib import contextmanager
from datetime import datetime, timezone
from unittest.mock import patch
from uuid import uuid4

import pytest

from app.models.enums import (
    AuthProvider,
    NotificationChannel,
    NotificationEvent,
    NotificationStatus,
    Periodicity,
)
from app.models.habit import Habit
from app.models.habit_record import HabitRecord
from app.models.notification import Notification
from app.models.user import User


# ── DB session proxy ─────────────────────────────────────────────

@pytest.fixture
def task_session(db_session):
    """
    Yield db_session with close() neutralised so tasks can call
    db.close() without expunging objects the test still needs to inspect.
    """
    with patch.object(db_session, "close"):
        yield db_session


# ── Model factories ───────────────────────────────────────────────

def make_user(db, **kwargs) -> User:
    user = User(
        email=kwargs.get("email", f"test_{uuid4()}@example.com"),
        auth_provider=AuthProvider.LOCAL,
        timezone="UTC",
        locale="en",
    )
    db.add(user)
    db.flush()
    return user


def make_habit(db, user_id, periodicity=Periodicity.DAILY, archived=False, **kwargs) -> Habit:
    habit = Habit(
        user_id=user_id,
        name=kwargs.get("name", "Test Habit"),
        unit="times",
        periodicity=periodicity,
        archived_at=datetime(2000, 1, 1) if archived else None,
    )
    db.add(habit)
    db.flush()
    return habit


def make_habit_record(db, habit_id, user_id, timestamp=None) -> HabitRecord:
    record = HabitRecord(
        habit_id=habit_id,
        user_id=user_id,
        timestamp=timestamp or datetime.now(timezone.utc),
        value=1,
    )
    db.add(record)
    db.flush()
    return record


def make_notification(db, user_id, **kwargs) -> Notification:
    n = Notification(
        user_id=user_id,
        channel=kwargs.get("channel", NotificationChannel.EMAIL),
        event=kwargs.get("event", NotificationEvent.GOAL_COMPLETED),
        payload=kwargs.get("payload", {}),
        status=kwargs.get("status", NotificationStatus.PENDING),
        scheduled_at=datetime.now(timezone.utc).time(),
        retry_count=kwargs.get("retry_count", 0),
    )
    db.add(n)
    db.flush()
    return n
