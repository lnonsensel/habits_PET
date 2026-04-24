from app.crud.router_factory import create_crud_router
from app.crud.habits import habits_crud
from app.schemas.habits import (
    HabitCreate,
    HabitResponse,
    HabitUpdate,
)

habits_crud_router = create_crud_router(
    prefix="/habits",
    crud=habits_crud,
    create_schema=HabitCreate,
    response_schema=HabitResponse,
    update_schema=HabitUpdate,
    tags=["Habits"],
)

# Create new endpoints for habits_crud_router
# @habits_crud_router.get()
