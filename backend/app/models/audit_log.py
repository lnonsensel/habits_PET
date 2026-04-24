import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Enum as SQLAlchemyEnum,
    Time,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.enums import (
    LogAction,
)

from app.core.database import Base


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
