from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class HabitRecordBase(BaseModel):
    habit_id: UUID = Field(..., description="Habit ID, affected by this record")
    value: int = Field(..., description="Value of record")
    notes: Optional[str] = Field(None, description="Additional notes to Record")


class HabitRecordCreate(HabitRecordBase):
    user_id: UUID = Field(..., description="User ID that created this record")


class HabitRecordResponse(HabitRecordBase):
    id: UUID = Field(..., description="Habit Record ID")
    user_id: UUID = Field(..., description="User that created habit record")
    timestamp: datetime = Field(..., description="Record timestamp")
    model_config = ConfigDict(from_attributes=True)


class HabitRecordUpdate(BaseModel):
    value: Optional[int] = None
    notes: Optional[str] = None
    model_config = ConfigDict(extra="forbid")
