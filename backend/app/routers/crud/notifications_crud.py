from app.crud.router_factory import create_crud_router
from app.crud.notifications import notifications_crud
from app.schemas.notifications import (
    NotificationCreate,
    NotificationResponse,
    NotificationUpdate,
)

notifications_crud_router = create_crud_router(
    prefix="/notifications",
    crud=notifications_crud,
    create_schema=NotificationCreate,
    response_schema=NotificationResponse,
    update_schema=NotificationUpdate,
    tags=["Notifications"],
)

# Create new endpoints for notifications_crud_router
# @notifications_crud_router.get()
