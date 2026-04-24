from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import ConfigDict, Field, BaseModel
from sqlalchemy import desc

from app.models.enums import Periodicity


class HabitBase(BaseModel):
    name: str = Field(..., max_length=255, description="Name of habit")
    description: str = Field(..., max_length=1024, description="Description of habit")
    unit: str = Field(
        ...,
        max_length=255,
        description="Habit units",
        examples=["km", "seconds", "times"],
    )
    periodicity: Periodicity = Field(
        default=Periodicity.DAILY, description="Periodicity of habit"
    )
    target_value: Optional[int] = Field(
        None, description="Target numeric value per period"
    )


class HabitCreate(HabitBase):
    pass


class HabitResponse(HabitBase):
    id: UUID = Field(..., description="Habit ID")
    user_id: UUID = Field(..., description="User ID, owner of habit")
    created_at: datetime = Field(..., description="Date of habit creation")
    archived_at: Optional[datetime] = Field(
        None, description="Date of habit archivation"
    )
    model_config = ConfigDict(from_attributes=True)


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    periodicity: Optional[str] = None
    target_value: Optional[int] = None
    archived_at: Optional[datetime] = None
    model_config = ConfigDict(extra="forbid")
