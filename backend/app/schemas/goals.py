# app/schemas/goal.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, time
from uuid import UUID
from typing import Optional
from decimal import Decimal


class GoalBase(BaseModel):
    name: str = Field(..., max_length=255, description="Название цели")
    description: Optional[str] = Field(
        None, max_length=255, description="Описание цели"
    )
    habit_id: Optional[UUID] = Field(
        None, description="ID связанной привычки (если есть)"
    )
    start_date: datetime = Field(..., description="Дата и время начала цели")
    end_date: datetime = Field(..., description="Дата и время окончания цели")
    target_value: Optional[Decimal] = Field(
        None,
        description="Целевое значение (например, количество дней, километров и т.п.)",
    )


class GoalCreate(GoalBase):
    user_id: UUID = Field(..., description="ID пользователя, владельца цели")


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=255)
    habit_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_value: Optional[Decimal] = None
    archived_at: Optional[datetime] = None
    model_config = ConfigDict(extra="forbid")


class GoalResponse(GoalBase):
    id: UUID = Field(..., description="Уникальный идентификатор цели")
    user_id: UUID = Field(..., description="ID пользователя")
    created_at: time = Field(..., description="Время создания цели (без даты?)")
    archived_at: Optional[time] = Field(None, description="Время архивации (если есть)")
    model_config = ConfigDict(from_attributes=True)  # allow ORM mode
