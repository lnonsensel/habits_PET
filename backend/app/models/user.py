import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.enums import (
    AuthProvider,
)

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(
        String(255), nullable=True
    )  # Nullable для OAuth-пользователей
    auth_provider = Column(
        SQLAlchemyEnum(AuthProvider), nullable=False, default=AuthProvider.LOCAL
    )
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    timezone = Column(String(50), nullable=False, default="UTC")
    locale = Column(String(10), nullable=False, default="en")
