from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.schemas.users import LoginRequest, UserCreate, UserResponse
from app.services.auth.auth_service import AuthService

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post(
    "/register/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user_data: UserCreate, db: Session = Depends(get_session)):
    """
    Register a new user.

    - **email**: must be a valid email address
    - **password**: minimum 8 characters, maximum 100
    - **auth_provider**: 'local' or OAuth providers (e.g., 'google')
    - **timezone**: IANA timezone (default UTC)
    - **locale**: locale code (default 'en')
    """
    return await AuthService(db).register_user(user_data)


@auth_router.post(
    "/login/",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def login(credentials: LoginRequest, db: Session = Depends(get_session)):
    """
    Log in with email and password.

    Returns the user object on success. Raises 401 if credentials are invalid.
    """
    return await AuthService(db).login_user(credentials.email, credentials.password)
