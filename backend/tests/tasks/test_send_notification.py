"""
Unit tests for app.tasks.notifications.send_notification.

SessionLocal is patched to return the test db_session so the task uses
the same in-memory transaction as the test. Delivery functions are mocked
to avoid real network calls.
"""
from unittest.mock import patch
from uuid import uuid4

import pytest
from celery.exceptions import Retry

from app.models.enums import NotificationChannel, NotificationStatus
from app.tasks.notifications import send_notification
from tests.tasks.conftest import make_notification, make_user


@pytest.fixture(autouse=True)
def patch_session(task_session):
    with patch("app.tasks.notifications.SessionLocal", return_value=task_session):
        yield task_session


# ── Channel dispatch ─────────────────────────────────────────────

def test_email_channel_calls_send_email(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id, channel=NotificationChannel.EMAIL)

    with patch("app.tasks.notifications._send_email") as mock:
        send_notification(str(n.id))

    mock.assert_called_once_with(n)


def test_push_channel_calls_send_push(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id, channel=NotificationChannel.PUSH)

    with patch("app.tasks.notifications._send_push") as mock:
        send_notification(str(n.id))

    mock.assert_called_once_with(n)


def test_webhook_channel_calls_send_webhook(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id, channel=NotificationChannel.WEBHOOK)

    with patch("app.tasks.notifications._send_webhook") as mock:
        send_notification(str(n.id))

    mock.assert_called_once_with(n)


# ── Status transitions ───────────────────────────────────────────

def test_status_becomes_sent_on_success(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id)

    with patch("app.tasks.notifications._send_email"):
        send_notification(str(n.id))

    db.refresh(n)
    assert n.status == NotificationStatus.SENT


def test_sent_at_is_populated_on_success(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id)

    with patch("app.tasks.notifications._send_email"):
        send_notification(str(n.id))

    db.refresh(n)
    assert n.sent_at is not None


def test_already_sent_notification_is_skipped(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id, status=NotificationStatus.SENT)

    with patch("app.tasks.notifications._send_email") as mock:
        send_notification(str(n.id))

    mock.assert_not_called()


def test_nonexistent_id_returns_without_error(patch_session):
    send_notification(str(uuid4()))  # must not raise


# ── Failure handling ─────────────────────────────────────────────

def test_delivery_failure_marks_status_failed(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id)

    with patch("app.tasks.notifications._send_email", side_effect=RuntimeError("SMTP down")):
        with pytest.raises((Retry, RuntimeError)):
            send_notification(str(n.id))

    db.refresh(n)
    assert n.status == NotificationStatus.FAILED


def test_delivery_failure_increments_retry_count(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id, retry_count=1)

    with patch("app.tasks.notifications._send_email", side_effect=RuntimeError("SMTP down")):
        with pytest.raises((Retry, RuntimeError)):
            send_notification(str(n.id))

    db.refresh(n)
    assert n.retry_count == 2


def test_delivery_failure_raises_for_celery_retry(patch_session):
    db = patch_session
    user = make_user(db)
    n = make_notification(db, user.id)

    with patch("app.tasks.notifications._send_email", side_effect=RuntimeError("down")):
        with pytest.raises((Retry, RuntimeError)):
            send_notification(str(n.id))
