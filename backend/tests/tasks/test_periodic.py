"""
Unit tests for periodic Celery tasks.

_dispatch() is mocked throughout to avoid triggering real send_notification.delay()
calls (which would require a live Celery broker). SessionLocal is patched to
return the test db_session so all DB operations participate in the same
rollback-on-teardown transaction.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import call, patch

import pytest

from app.models.enums import NotificationEvent, NotificationStatus, Periodicity
from app.models.notification import Notification
from app.tasks.periodic import (
    check_streaks,
    cleanup_notifications,
    dispatch_pending_notifications,
    send_daily_reminders,
    send_weekly_summary,
)
from tests.tasks.conftest import (
    make_habit,
    make_habit_record,
    make_notification,
    make_user,
)


@pytest.fixture(autouse=True)
def patch_session(task_session):
    with patch("app.tasks.periodic.SessionLocal", return_value=task_session):
        yield task_session


# ── check_streaks ─────────────────────────────────────────────────

class TestCheckStreaks:
    def test_creates_streak_lost_for_missed_day(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, periodicity=Periodicity.DAILY)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = check_streaks()

        assert count == 1
        mock_dispatch.assert_called_once()

    def test_no_notification_when_record_logged_yesterday(self, patch_session):
        db = patch_session
        user = make_user(db)
        habit = make_habit(db, user.id, periodicity=Periodicity.DAILY)

        # noon UTC yesterday — guaranteed to fall in [yesterday_start, yesterday_end)
        yesterday_noon = (datetime.now(timezone.utc) - timedelta(days=1)).replace(
            hour=12, minute=0, second=0, microsecond=0,
        )
        make_habit_record(db, habit.id, user.id, timestamp=yesterday_noon)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = check_streaks()

        assert count == 0
        mock_dispatch.assert_not_called()

    def test_archived_habits_are_ignored(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, periodicity=Periodicity.DAILY, archived=True)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = check_streaks()

        assert count == 0
        mock_dispatch.assert_not_called()

    def test_weekly_habits_are_ignored(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, periodicity=Periodicity.WEEKLY)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = check_streaks()

        assert count == 0
        mock_dispatch.assert_not_called()

    def test_creates_one_notification_per_habit(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, name="Morning run")
        make_habit(db, user.id, name="Read")

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = check_streaks()

        assert count == 2
        assert mock_dispatch.call_count == 2

    def test_notification_event_is_streak_lost(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id)

        with patch("app.tasks.periodic._dispatch"):
            check_streaks()

        n = db.query(Notification).filter(
            Notification.user_id == user.id
        ).first()
        assert n.event == NotificationEvent.STREAK_LOST
        assert n.status == NotificationStatus.PENDING

    def test_payload_contains_habit_info(self, patch_session):
        db = patch_session
        user = make_user(db)
        habit = make_habit(db, user.id, name="Evening walk")

        with patch("app.tasks.periodic._dispatch"):
            check_streaks()

        n = db.query(Notification).filter(Notification.user_id == user.id).first()
        assert n.payload["habit_name"] == "Evening walk"
        assert n.payload["habit_id"] == str(habit.id)

    def test_returns_zero_with_no_habits(self, patch_session):
        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = check_streaks()

        assert count == 0
        mock_dispatch.assert_not_called()


# ── send_daily_reminders ──────────────────────────────────────────

class TestSendDailyReminders:
    def test_creates_notification_for_user_with_daily_habit(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, periodicity=Periodicity.DAILY)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_daily_reminders()

        assert count == 1
        mock_dispatch.assert_called_once()

    def test_no_notification_without_daily_habits(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, periodicity=Periodicity.WEEKLY)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_daily_reminders()

        assert count == 0
        mock_dispatch.assert_not_called()

    def test_only_one_notification_per_user_regardless_of_habit_count(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id)
        make_habit(db, user.id)
        make_habit(db, user.id)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_daily_reminders()

        assert count == 1
        mock_dispatch.assert_called_once()

    def test_archived_habits_do_not_trigger_reminder(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, archived=True)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_daily_reminders()

        assert count == 0

    def test_notification_event_is_daily_remainder(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id)

        with patch("app.tasks.periodic._dispatch"):
            send_daily_reminders()

        n = db.query(Notification).filter(Notification.user_id == user.id).first()
        assert n.event == NotificationEvent.DAILY_REMAINDER

    def test_multiple_users_each_get_one_notification(self, patch_session):
        db = patch_session
        u1, u2 = make_user(db), make_user(db)
        make_habit(db, u1.id)
        make_habit(db, u2.id)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_daily_reminders()

        assert count == 2
        assert mock_dispatch.call_count == 2


# ── send_weekly_summary ───────────────────────────────────────────

class TestSendWeeklySummary:
    def test_creates_notification_for_user_with_any_habit(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, periodicity=Periodicity.WEEKLY)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_weekly_summary()

        assert count == 1
        mock_dispatch.assert_called_once()

    def test_no_notification_without_any_habits(self, patch_session):
        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_weekly_summary()

        assert count == 0
        mock_dispatch.assert_not_called()

    def test_archived_habits_do_not_trigger_summary(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id, archived=True)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_weekly_summary()

        assert count == 0

    def test_notification_event_is_summary_weekly(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id)

        with patch("app.tasks.periodic._dispatch"):
            send_weekly_summary()

        n = db.query(Notification).filter(Notification.user_id == user.id).first()
        assert n.event == NotificationEvent.SUMMARY_WEEKLY

    def test_one_notification_per_user_even_with_multiple_habits(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_habit(db, user.id)
        make_habit(db, user.id, periodicity=Periodicity.WEEKLY)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = send_weekly_summary()

        assert count == 1


# ── cleanup_notifications ─────────────────────────────────────────

class TestCleanupNotifications:
    def test_deletes_sent_notifications(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_notification(db, user.id, status=NotificationStatus.SENT)
        make_notification(db, user.id, status=NotificationStatus.SENT)

        deleted = cleanup_notifications()

        assert deleted == 2
        remaining = db.query(Notification).filter(Notification.user_id == user.id).count()
        assert remaining == 0

    def test_preserves_pending_notifications(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_notification(db, user.id, status=NotificationStatus.PENDING)
        make_notification(db, user.id, status=NotificationStatus.SENT)

        cleanup_notifications()

        remaining = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.status == NotificationStatus.PENDING,
        ).count()
        assert remaining == 1

    def test_preserves_failed_notifications(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_notification(db, user.id, status=NotificationStatus.FAILED)
        make_notification(db, user.id, status=NotificationStatus.SENT)

        cleanup_notifications()

        remaining = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.status == NotificationStatus.FAILED,
        ).count()
        assert remaining == 1

    def test_returns_zero_when_nothing_to_clean(self, patch_session):
        deleted = cleanup_notifications()
        assert deleted == 0


# ── dispatch_pending_notifications ────────────────────────────────

class TestDispatchPendingNotifications:
    def test_dispatches_pending_notifications(self, patch_session):
        db = patch_session
        user = make_user(db)
        n1 = make_notification(db, user.id, status=NotificationStatus.PENDING)
        n2 = make_notification(db, user.id, status=NotificationStatus.PENDING)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = dispatch_pending_notifications()

        assert count == 2
        dispatched_ids = {c.args[0] for c in mock_dispatch.call_args_list}
        assert str(n1.id) in dispatched_ids
        assert str(n2.id) in dispatched_ids

    def test_skips_sent_notifications(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_notification(db, user.id, status=NotificationStatus.SENT)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = dispatch_pending_notifications()

        assert count == 0
        mock_dispatch.assert_not_called()

    def test_skips_notifications_with_max_retries(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_notification(db, user.id, status=NotificationStatus.PENDING, retry_count=3)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = dispatch_pending_notifications()

        assert count == 0
        mock_dispatch.assert_not_called()

    def test_dispatches_pending_with_retries_below_max(self, patch_session):
        db = patch_session
        user = make_user(db)
        make_notification(db, user.id, status=NotificationStatus.PENDING, retry_count=2)

        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = dispatch_pending_notifications()

        assert count == 1
        mock_dispatch.assert_called_once()

    def test_returns_zero_with_no_pending(self, patch_session):
        with patch("app.tasks.periodic._dispatch") as mock_dispatch:
            count = dispatch_pending_notifications()

        assert count == 0
        mock_dispatch.assert_not_called()
