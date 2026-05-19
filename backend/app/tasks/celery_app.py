import os

from celery import Celery
from celery.schedules import crontab


def _redis_url(db: int) -> str:
    password = os.getenv("REDIS_PASSWORD", "")
    host     = os.getenv("REDIS_HOST",     "localhost")
    port     = os.getenv("REDIS_PORT",     "6379")
    auth     = f":{password}@" if password else ""
    return f"redis://{auth}{host}:{port}/{db}"


celery_app = Celery(
    "habitpet",
    broker=_redis_url(1),   # db/0 reserved for app cache/pub-sub
    backend=_redis_url(2),
    include=[
        "app.tasks.notifications",
        "app.tasks.periodic",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        # Streak check: every day at 07:00 UTC
        "check-streaks-daily": {
            "task": "app.tasks.periodic.check_streaks",
            "schedule": crontab(hour=7, minute=0),
        },
        # Daily reminder: every day at 08:00 UTC
        "send-daily-reminders": {
            "task": "app.tasks.periodic.send_daily_reminders",
            "schedule": crontab(hour=8, minute=0),
        },
        # Weekly summary: every Sunday at 09:00 UTC
        "send-weekly-summary": {
            "task": "app.tasks.periodic.send_weekly_summary",
            "schedule": crontab(day_of_week=0, hour=9, minute=0),
        },
        # Cleanup: every night at 03:00 UTC
        "cleanup-notifications": {
            "task": "app.tasks.periodic.cleanup_notifications",
            "schedule": crontab(hour=3, minute=0),
        },
        # Fallback poll: every 60 seconds to catch any missed PENDING notifications
        "dispatch-pending-fallback": {
            "task": "app.tasks.periodic.dispatch_pending_notifications",
            "schedule": 60.0,
        },
        # Prometheus gauges: refresh every 30 seconds
        "refresh-business-metrics": {
            "task": "app.tasks.periodic.refresh_business_metrics",
            "schedule": 30.0,
        },
    },
)
