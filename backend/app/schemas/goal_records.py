from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import GoalSource


class GoalRecordBase(BaseModel):
    goal_id: UUID = Field(..., description="Goal ID, that record is about")
    value: int = Field(..., description="Value of record")
    source: GoalSource = Field(
        default=GoalSource.MANUAL, description="Way of changing/creating of the record"
    )


class GoalRecordCreate(GoalRecordBase):
    pass


class GoalRecordResponse(GoalRecordBase):
    id: UUID = Field(..., description="Goal record ID")
    created_at: datetime = Field(..., description="Date of the record creation")
    updated_at: datetime = Field(..., description="Date of the record last update")
    model_config = ConfigDict(from_attributes=True)


class GoalRecordUpdate(BaseModel):
    goal_id: Optional[int] = None
    value: Optional[int] = None
    source: Optional[GoalSource] = None
    model_config = ConfigDict(extra="forbid")
