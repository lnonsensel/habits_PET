# app/services/auth_service.py
import asyncio
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.crud.users import users_crud
from app.models.enums import AuthProvider
from app.schemas.users import UserCreate
from app.models.user import User
from app.core.exceptions import (
    UserAlreadyExistsError,
    PasswordRequiredError,
    PasswordNotAllowedError,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    async def get_hash(self, pwd: str) -> str:
        hash = await asyncio.to_thread(pwd_context.hash, pwd)
        return hash

    async def register_user(self, user_data: UserCreate) -> User:
        existing = users_crud.get_by_email(self.db, user_data.email)
        if existing:
            raise UserAlreadyExistsError()

        if user_data.auth_provider == AuthProvider.LOCAL:
            if not user_data.password:
                raise PasswordRequiredError()
            password_hash = await self.get_hash(user_data.password)
            if user_data.password:
                raise PasswordNotAllowedError()
        else:
            password_hash = None

        try:
            user = users_crud.create_with_password_hash(
                db=self.db, password_hash=password_hash, user_data=user_data
            )
        except IntegrityError:
            self.db.rollback()
            raise UserAlreadyExistsError()
        return user
