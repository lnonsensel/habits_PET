import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional

from sqlalchemy import desc

from models.tables import AuthProvider


class UserBase(BaseModel):
    email: EmailStr = Field(
        ..., description="User`s email address", example="user@example.com"
    )
    timezone: str = Field(
        default="UTC", description="IANA timezone", example="Europe/London"
    )
    locale: str = Field(default="en", description="Locale code", example="en")


class UserCreate(UserBase):
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=100,
        description="Password (8-100) characters",
        example="S3curePassw0rd!!!",
    )
    auth_provider: AuthProvider = Field(
        default=AuthProvider.LOCAL, description="Authentication provider"
    )
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
    id: uuid.UUID = Field(..., description="User`s unique identifier")
    auth_provider: AuthProvider = Field(default=AuthProvider.LOCAL)
    created_at: datetime.datetime
    updated_at: datetime.datetime
    last_login_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="New email address")
    timezone: Optional[str] = Field(None, description="IANA timezone")
    locale: Optional[str] = Field(None, description="Locale code")
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=100,
        description="New password (8-100 characters)",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timezone": "America/New_York",
                "locale": "es",
                "password": "NewPass123!",
            }
        }
    )
