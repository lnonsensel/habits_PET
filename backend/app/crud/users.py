from typing import Any

from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions.crud_exceptions import DuplicateKeyError, ObjectNotFoundError
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.users import UserCreate, UserUpdate

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserCRUD(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    def create_with_password_hash(
        self, db: Session, password_hash: str | None, user_data: UserCreate
    ) -> User:
        new_user = User(
            email=user_data.email,
            password_hash=password_hash,
            auth_provider=user_data.auth_provider,
            timezone=user_data.timezone,
            locale=user_data.locale,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    def create(self, db: Session, obj_in: UserCreate) -> User:
        password_hash = _pwd_context.hash(obj_in.password) if obj_in.password else None
        db_obj = User(
            email=obj_in.email,
            timezone=obj_in.timezone,
            locale=obj_in.locale,
            auth_provider=obj_in.auth_provider,
            password_hash=password_hash,
        )
        db.add(db_obj)
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            raise DuplicateKeyError(self.tablename, e.orig)
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, id: Any, obj_in: UserUpdate) -> User:
        db_obj = self.get(db, id)
        if not db_obj:
            raise ObjectNotFoundError(self.tablename)
        update_data = obj_in.model_dump(exclude_unset=True, exclude={"password"})
        if obj_in.password:
            update_data["password_hash"] = _pwd_context.hash(obj_in.password)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj


users_crud = UserCRUD(User)
