import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


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
