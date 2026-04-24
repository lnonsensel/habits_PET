from app.crud.router_factory import create_crud_router
from app.crud.goal_records import goal_records_crud
from app.schemas.goal_records import (
    GoalRecordCreate,
    GoalRecordResponse,
    GoalRecordUpdate,
)

goal_records_crud_router = create_crud_router(
    prefix="/goal_records",
    crud=goal_records_crud,
    create_schema=GoalRecordCreate,
    response_schema=GoalRecordResponse,
    update_schema=GoalRecordUpdate,
    tags=["GoalRecords"],
)

# Create new endpoints for goal_records_crud_router
# @goal_records_crud_router.get()
