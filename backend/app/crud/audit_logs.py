import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.enums import LogAction

logger = logging.getLogger("habitpet.audit")


def write_audit_log(
    db: Session,
    user_id,
    event: LogAction,
    context: dict | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    """
    Создаёт запись в audit_log. Не бросает исключений —
    сбой логирования не должен прерывать основную операцию.
    """
    try:
        entry = AuditLog(
            user_id=user_id,
            event=event,
            context=context or {},
            ip=ip,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.warning("Failed to write audit log event=%s user=%s: %s", event, user_id, exc)
