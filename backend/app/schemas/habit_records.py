# class HabitRecord(Base):
#     __tablename__ = "habit_records"
#
#     id = Column(
#         UUID(as_uuid=True),
#         primary_key=True,
#         default=uuid.uuid4,
#         unique=True,
#         nullable=False,
#     )
#     habit_id = Column(
#         UUID(as_uuid=True),
#         ForeignKey("habits.id", ondelete="CASCADE"),
#         nullable=False,
#     )
#     user_id = Column(
#         UUID(as_uuid=True),
#         ForeignKey("users.id", ondelete="CASCADE"),
#         nullable=False,
#     )
#     timestamp = Column(Time(timezone=True), nullable=False, server_default=func.now())
#     value = Column(Numeric(10, 2), nullable=False, default=1)
#     notes = Column(Text, nullable=True)

from datetime import time
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class HabitRecordBase(BaseModel):
    habit_id: UUID = Field(..., description="Habit ID, affected by this record")
    value: int = Field(..., description="Value of record")
    notes: Optional[str] = Field(None, description="Additional notes to Record")


class HabitRecordCreate(HabitRecordBase):
    pass


class HabitRecordResponse(HabitRecordBase):
    id: UUID = Field(..., description="Habit Record ID")
    user_id: UUID = Field(..., description="User that created habit record")
    timestamp: time = Field(..., description="Record timestamp")
    model_config = ConfigDict(from_attributes=True)


class HabitRecordUpdate(BaseModel):
    value: Optional[int] = None
    notes: Optional[str] = None
    model_config = ConfigDict(extra="forbid")
