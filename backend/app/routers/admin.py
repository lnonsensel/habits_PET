import os
import secrets
from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.crud.notifications import notifications_crud
from app.models.audit_log import AuditLog
from app.models.enums import LogAction, NotificationChannel, NotificationEvent, NotificationStatus
from app.models.habit import Habit
from app.models.habit_record import HabitRecord
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notifications import NotificationCreate, NotificationUpdate

admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])
# auto_error=False — не добавляем WWW-Authenticate: Basic в 401,
# иначе браузер перехватывает ответ и показывает нативный диалог вместо React-формы
_security = HTTPBasic(auto_error=False)


def require_admin(credentials: Optional[HTTPBasicCredentials] = Depends(_security)) -> None:
    expected_user = os.getenv("ADMIN_USERNAME", "admin")
    expected_pass = os.getenv("ADMIN_PASSWORD", "")
    ok = (
        credentials is not None
        and secrets.compare_digest(credentials.username, expected_user)
        and secrets.compare_digest(credentials.password, expected_pass)
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


# ── Stats ─────────────────────────────────────────────────────────

@admin_router.get("/stats")
def get_stats(
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> dict[str, Any]:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    return {
        "users_total":             db.query(func.count(User.id)).scalar(),
        "users_active_today":      db.query(func.count(func.distinct(HabitRecord.user_id)))
                                     .filter(HabitRecord.timestamp >= today).scalar(),
        "habits_total":            db.query(func.count(Habit.id))
                                     .filter(Habit.archived_at.is_(None)).scalar(),
        "records_today":           db.query(func.count(HabitRecord.id))
                                     .filter(HabitRecord.timestamp >= today).scalar(),
        "notifications_pending":   db.query(func.count(Notification.id))
                                     .filter(Notification.status == NotificationStatus.PENDING).scalar(),
        "notifications_failed":    db.query(func.count(Notification.id))
                                     .filter(Notification.status == NotificationStatus.FAILED).scalar(),
    }


# ── Users ─────────────────────────────────────────────────────────

@admin_router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> list[dict[str, Any]]:
    habits_count_sq = (
        db.query(Habit.user_id, func.count(Habit.id).label("cnt"))
        .filter(Habit.archived_at.is_(None))
        .group_by(Habit.user_id)
        .subquery()
    )

    query = db.query(User, func.coalesce(habits_count_sq.c.cnt, 0).label("habits_count")) \
              .outerjoin(habits_count_sq, habits_count_sq.c.user_id == User.id)

    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))

    rows = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id":            str(user.id),
            "email":         user.email,
            "auth_provider": user.auth_provider.value,
            "created_at":    user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "habits_count":  habits_count,
        }
        for user, habits_count in rows
    ]


@admin_router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


# ── Notifications ─────────────────────────────────────────────────

class BroadcastRequest(BaseModel):
    recipients: Literal["all"] | list[UUID]
    event:   NotificationEvent
    channel: NotificationChannel = NotificationChannel.EMAIL
    payload: dict = Field(default_factory=dict)


@admin_router.post("/notifications/send")
def send_broadcast(
    body: BroadcastRequest,
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> dict[str, Any]:
    """Разослать уведомление всем пользователям или выбранным."""
    if body.recipients == "all":
        user_ids = [row[0] for row in db.query(User.id).all()]
    else:
        user_ids = body.recipients

    created = 0
    for uid in user_ids:
        notifications_crud.create(db, NotificationCreate(
            user_id=uid,
            channel=body.channel,
            event=body.event,
            payload=body.payload,
            scheduled_at=datetime.now(timezone.utc).time(),
        ))
        created += 1

    return {"created": created, "user_ids": [str(u) for u in user_ids]}


@admin_router.get("/notifications")
def list_notifications(
    skip: int = 0,
    limit: int = 50,
    filter_status: Optional[str] = None,
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> list[dict[str, Any]]:
    query = db.query(Notification, User.email) \
              .join(User, User.id == Notification.user_id)

    if filter_status and filter_status != "all":
        try:
            st = NotificationStatus(filter_status)
            query = query.filter(Notification.status == st)
        except ValueError:
            pass

    rows = query.offset(skip).limit(limit).all()

    return [
        {
            "id":          str(n.id),
            "user_email":  email,
            "channel":     n.channel.value,
            "event":       n.event.value,
            "status":      n.status.value,
            "retry_count": n.retry_count,
            "payload":     n.payload,
        }
        for n, email in rows
    ]


@admin_router.post("/notifications/{notification_id}/retry", status_code=204)
def retry_notification(
    notification_id: UUID,
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> None:
    from app.tasks.notifications import send_notification

    n = notifications_crud.get(db, notification_id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    notifications_crud.update(
        db,
        id=notification_id,
        obj_in=NotificationUpdate(status=NotificationStatus.PENDING, retry_count=0),
    )
    try:
        send_notification.delay(str(notification_id))
    except Exception:
        pass


# ── Habits ────────────────────────────────────────────────────────

@admin_router.get("/habits")
def list_habits(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> list[dict[str, Any]]:
    records_sq = (
        db.query(HabitRecord.habit_id, func.count(HabitRecord.id).label("cnt"))
        .group_by(HabitRecord.habit_id)
        .subquery()
    )

    query = db.query(Habit, User.email, func.coalesce(records_sq.c.cnt, 0).label("records_count")) \
              .join(User, User.id == Habit.user_id) \
              .outerjoin(records_sq, records_sq.c.habit_id == Habit.id) \
              .filter(Habit.archived_at.is_(None))

    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))

    rows = query.order_by(Habit.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id":            str(habit.id),
            "user_email":    email,
            "name":          habit.name,
            "periodicity":   habit.periodicity.value,
            "target_value":  float(habit.target_value) if habit.target_value else None,
            "records_count": records_count,
            "created_at":    habit.created_at.isoformat() if habit.created_at else None,
        }
        for habit, email, records_count in rows
    ]


# ── Prometheus metrics summary ────────────────────────────────────

@admin_router.get("/metrics-summary")
def get_metrics_summary(
    _: None = Depends(require_admin),
) -> dict[str, Any]:
    """Текущие значения Prometheus-метрик из реестра процесса."""
    from prometheus_client import REGISTRY

    http_by_status: dict[str, float] = {"2xx": 0.0, "3xx": 0.0, "4xx": 0.0, "5xx": 0.0}
    http_total = 0.0
    http_dur_sum = 0.0
    http_dur_count = 0.0
    crud_ops: dict[str, dict[str, int]] = {}
    habits_active_val = None
    users_total_val = None
    endpoint_counts: dict[str, float] = {}

    _excluded_handlers = {"/metrics", "/health", "/health/db"}

    for mf in REGISTRY.collect():
        name = mf.name

        if name == "http_requests_total":
            for s in mf.samples:
                if s.name != "http_requests_total":
                    continue
                code = s.labels.get("status_code", "")
                handler = s.labels.get("handler", "unknown")
                v = s.value
                http_total += v
                prefix = (code[0] + "xx") if code and code[0].isdigit() else "other"
                http_by_status[prefix] = http_by_status.get(prefix, 0.0) + v
                if handler not in _excluded_handlers:
                    endpoint_counts[handler] = endpoint_counts.get(handler, 0.0) + v

        elif name == "http_request_duration_highr_seconds":
            for s in mf.samples:
                if s.name == "http_request_duration_highr_seconds_sum":
                    http_dur_sum += s.value
                elif s.name == "http_request_duration_highr_seconds_count":
                    http_dur_count += s.value

        elif name == "habitpet_crud_ops_total":
            for s in mf.samples:
                if s.name != "habitpet_crud_ops_total":
                    continue
                table = s.labels.get("table", "")
                op = s.labels.get("operation", "")
                crud_ops.setdefault(table, {})[op] = int(s.value)

        elif name == "habitpet_habits_active_total":
            for s in mf.samples:
                habits_active_val = s.value

        elif name == "habitpet_users_total":
            for s in mf.samples:
                users_total_val = s.value

    avg_latency_ms = (
        round(http_dur_sum / http_dur_count * 1000, 1)
        if http_dur_count > 0 else None
    )

    top_endpoints = sorted(
        [{"handler": h, "count": int(c)} for h, c in endpoint_counts.items()],
        key=lambda x: x["count"], reverse=True,
    )[:8]

    return {
        "http_total":     int(http_total),
        "http_by_status": {k: int(v) for k, v in http_by_status.items()},
        "avg_latency_ms": avg_latency_ms,
        "crud_ops":       crud_ops,
        "habits_active":  int(habits_active_val) if habits_active_val is not None else None,
        "users_total":    int(users_total_val) if users_total_val is not None else None,
        "top_endpoints":  top_endpoints,
    }


# ── Audit Logs ────────────────────────────────────────────────────

@admin_router.get("/logs")
def list_logs(
    skip: int = 0,
    limit: int = 100,
    filter_event: Optional[str] = None,
    db: Session = Depends(get_session),
    _: None = Depends(require_admin),
) -> list[dict[str, Any]]:
    query = db.query(AuditLog, User.email) \
              .join(User, User.id == AuditLog.user_id)

    if filter_event and filter_event != "all":
        try:
            query = query.filter(AuditLog.event == LogAction(filter_event))
        except ValueError:
            pass  # неизвестный тип события — фильтр не применяется

    rows = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id":         str(log.id),
            "user_email": email,
            "event":      log.event.value,
            "context":    log.context,
            "ip":         log.ip,
            "created_at": str(log.created_at) if log.created_at else None,
        }
        for log, email in rows
    ]
