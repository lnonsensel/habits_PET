from api.crud.router_factory import create_crud_router
from api.crud.base import CRUDBase
from models.tables import User
from api.schemas.users import UserCreate, UserResponse, UserUpdate

user_router = create_crud_router(
    prefix="/users",
    crud=CRUDBase,
    create_schema=UserCreate,
    response_schema=UserResponse,
    update_schema=UserUpdate,
    tags=["users"],
)
