from enum import Enum


class AuthProvider(Enum):
    LOCAL = "local"
    GOOGLE = "google"
    GITHUB = "github"


class Periodicity(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class GoalSource(Enum):
    MANUAL = "manual"
    HABIT_AUTO = "habit-auto"
    API = "api"


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


class LogAction(Enum):
    HABIT_CREATED = "habit_created"
    RECORD_ADDED = "record_added"
    LOGIN = "login"
    API_CALL = "api_call"
