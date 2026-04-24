# app/schemas/notification.py
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import time
from typing import Optional, Any
from app.models.enums import (
    NotificationChannel,
    NotificationEvent,
    NotificationStatus,
)


class NotificationBase(BaseModel):
    channel: NotificationChannel = Field(
        ..., description="Delivery channel (e.g., email, push)"
    )
    event: NotificationEvent = Field(
        ..., description="Event that triggered this notification"
    )
    payload: Optional[Any] = Field(
        None, description="Arbitrary JSON payload with notification data"
    )
    scheduled_at: time = Field(
        ..., description="Time when the notification should be sent (timezone‑aware)"
    )


class NotificationCreate(NotificationBase):
    user_id: Optional[UUID] = Field(
        None,
        description="ID of the user who will receive the notification. If not provided, taken from the current authenticated user.",
    )


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = Field(
        None, description="New status (e.g., SENT, FAILED)"
    )
    sent_at: Optional[time] = Field(
        None, description="Time when notification was actually sent"
    )
    retry_count: Optional[int] = Field(
        None, ge=0, description="Number of send attempts"
    )
    model_config = ConfigDict(extra="forbid")


class NotificationResponse(NotificationBase):
    id: UUID = Field(..., description="Unique notification ID")
    user_id: UUID = Field(..., description="ID of the user who owns the notification")
    status: NotificationStatus = Field(..., description="Current delivery status")
    sent_at: Optional[time] = Field(
        None, description="Time when notification was actually sent"
    )
    retry_count: int = Field(..., description="Number of send attempts")
    created_at: time = Field(
        ..., description="Timestamp when the record was created (time only, no date)"
    )
    model_config = ConfigDict(from_attributes=True)
