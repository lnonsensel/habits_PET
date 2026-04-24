from app.crud.router_factory import create_crud_router
from app.crud.habit_records import habit_records_crud
from app.schemas.habit_records import (
    HabitRecordCreate,
    HabitRecordResponse,
    HabitRecordUpdate,
)

habit_records_crud_router = create_crud_router(
    prefix="/habit_records",
    crud=habit_records_crud,
    create_schema=HabitRecordCreate,
    response_schema=HabitRecordResponse,
    update_schema=HabitRecordUpdate,
    tags=["HabitRecords"],
)

# Create new endpoints for habit_records_crud_router
# @habit_records_crud_router.get()
