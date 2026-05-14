import asyncio

from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud.users import users_crud
from app.models.enums import AuthProvider
from app.models.user import User
from app.schemas.users import UserCreate
from app.core.exceptions import (
    UserAlreadyExistsError,
    PasswordRequiredError,
    PasswordNotAllowedError,
    InvalidCredentialsError,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    async def get_hash(self, pwd: str) -> str:
        return await asyncio.to_thread(pwd_context.hash, pwd)

    async def register_user(self, user_data: UserCreate) -> User:
        existing = users_crud.get_by_email(self.db, user_data.email)
        if existing:
            raise UserAlreadyExistsError()

        if user_data.auth_provider == AuthProvider.LOCAL:
            if not user_data.password:
                raise PasswordRequiredError()
            password_hash = await self.get_hash(user_data.password)
        else:
            if user_data.password:
                raise PasswordNotAllowedError()
            password_hash = None

        try:
            user = users_crud.create_with_password_hash(
                db=self.db, password_hash=password_hash, user_data=user_data
            )
        except IntegrityError:
            self.db.rollback()
            raise UserAlreadyExistsError()
        return user

    async def login_user(self, email: str, password: str) -> User:
        user = users_crud.get_by_email(self.db, email)
        if not user or not user.password_hash:
            raise InvalidCredentialsError()
        valid = await asyncio.to_thread(pwd_context.verify, password, user.password_hash)
        if not valid:
            raise InvalidCredentialsError()
        return user
