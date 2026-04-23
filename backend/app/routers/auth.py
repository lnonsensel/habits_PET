from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.schemas.users import UserCreate, UserResponse
from app.services.auth.auth_service import AuthService

auth_router = APIRouter(prefix="/auth")


@auth_router.post(
    "/register/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
)
async def register(user_data: UserCreate, db: Session = Depends(get_session)):
    """
    Register a new user.

    - **email**: must be a valid email address
    - **password**: minimum 8 characters, maximum 100
    - **auth_provider**: 'local' or OAuth providers (e.g., 'google')
    - **timezone**: IANA timezone (default UTC)
    - **locale**: locale code (default 'en')

    Returns the created user data (without password hash).
    """
    auth_service = AuthService(db)
    new_user = await auth_service.register_user(user_data)
    return new_user
