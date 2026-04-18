from warnings import deprecated
from fastapi import HTTPException, Response
from fastapi import APIRouter, Depends, status
from datetime import datetime
from sqlalchemy.orm import Session

from models.db import get_session
from api.schemas.users import UserCreate, UserResponse
from models.tables import AuthProvider, User

from passlib.context import CryptContext

auth_endpoints = APIRouter(prefix="/auth")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@auth_endpoints.post("/register/", response_model=)
async def register(user_data: UserCreate, db: Session = Depends(get_session)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with email already exists")
    if user_data.auth_provider == AuthProvider.LOCAL:
        if not user_data.password:
            raise HTTPException(
                status_code=400, detail="Password is required for registration"
            )
        password_hash = pwd_context.hash(user_data.password)
    else:
        password_hash = None

    db_user = User(
        email=user_data.email,
        password_hash=password_hash,
        auth_provider=user_data.auth_provider,
        timezone=user_data.timezone,
        locale=user_data.locale,
        created_at = datetime.now()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)


    return db_user
