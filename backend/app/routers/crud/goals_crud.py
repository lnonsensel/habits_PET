from app.crud.router_factory import create_crud_router
from app.crud.goals import goals_crud
from app.schemas.goals import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
)

goals_crud_router = create_crud_router(
    prefix="/goals",
    crud=goals_crud,
    create_schema=GoalCreate,
    response_schema=GoalResponse,
    update_schema=GoalUpdate,
    tags=["Goals"],
)

# Create new endpoints for goals_crud_router
# @goals_crud_router.get()
