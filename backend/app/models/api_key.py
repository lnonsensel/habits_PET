import uuid
from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Time,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.core.database import Base


class APIKey(Base):
    __tablename__ = "api_keys"

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
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False)
    scopes = Column(JSONB, default=dict)
    expires_at = Column(Time(timezone=True), nullable=True)
    created_at = Column(Time(timezone=True), nullable=False)
    revoked_at = Column(Time(timezone=True), nullable=True)
