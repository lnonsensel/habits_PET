import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from models.tables import AuthProvider


class UserBase(BaseModel):
    email: str = Field(max_length=255)
    timezone: str = Field(default="UTC")
    locale: str = Field(default="en")


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    auth_provider: AuthProvider = Field(default=AuthProvider.LOCAL)
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "auth_provider": "local",
                "timezone": "UTC",
                "locale": "en",
            }
        }
    )


class UserResponse(UserBase):
    id: uuid.UUID
    auth_provider: AuthProvider = Field(default=AuthProvider.LOCAL)
    created_at: datetime.datetime
    updated_at: datetime.datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
