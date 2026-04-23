from app.crud.router_factory import create_crud_router
from app.crud.users import users_crud
from app.schemas.users import UserCreate, UserResponse, UserUpdate

users_crud_router = create_crud_router(
    prefix="/users",
    crud=users_crud,
    create_schema=UserCreate,
    response_schema=UserResponse,
    update_schema=UserUpdate,
    tags=["Users"],
)

# Create new endpoints for users_crud_router
# @users_crud_router.get()
