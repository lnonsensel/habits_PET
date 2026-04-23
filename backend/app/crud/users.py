from sqlalchemy.orm import Session
from app.crud.base import CRUDBase

from app.models.enums import AuthProvider
from app.models.user import User
from app.schemas.users import UserCreate, UserUpdate


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


users_crud = UserCRUD(User)
