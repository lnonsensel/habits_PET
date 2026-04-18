from warnings import deprecated
from fastapi import HTTPException
from fastapi import APIRouter, Depends, status
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.db import get_session
from api.schemas.users import UserCreate, UserResponse
from models.tables import AuthProvider, User

from passlib.context import CryptContext
import asyncio

auth_endpoints = APIRouter(prefix="/auth")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

register_responses = {
    400: {
        "description": "Bad Request - User already exists or password provided for OAuth"
    },
    422: {
        "description": "Validation Error - Invalid email format, short password, etc."
    },
    409: {"description": "Conflict - Email already registered (IntegrityError)"},
}


@auth_endpoints.post(
    "/register/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses=register_responses,
    tags=["auth"],
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
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="User with such email already exists"
        )
    if user_data.auth_provider == AuthProvider.LOCAL:
        if not user_data.password:
            raise HTTPException(
                status_code=422, detail="Password is required for registration"
            )
        password_hash = await asyncio.to_thread(pwd_context.hash, user_data.password)
    elif user_data.password:
        raise HTTPException(status_code=400, detail="Password must not be provided")
    else:
        password_hash = None

    db_user = User(
        email=user_data.email,
        password_hash=password_hash,
        auth_provider=user_data.auth_provider,
        timezone=user_data.timezone,
        locale=user_data.locale,
        created_at=datetime.now(),
    )
    db.add(db_user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=422, detail="User with this email already exists"
        )
    db.refresh(db_user)

    return db_user
