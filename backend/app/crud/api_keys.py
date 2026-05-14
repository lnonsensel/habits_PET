import hashlib
import secrets

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions.crud_exceptions import DuplicateKeyError
from app.crud.base import CRUDBase
from app.models.api_key import APIKey
from app.schemas.api_keys import APIKeyCreate, APIKeyUpdate


class APIKeyCRUD(CRUDBase[APIKey, APIKeyCreate, APIKeyUpdate]):
    def create(self, db: Session, obj_in: APIKeyCreate) -> APIKey:
        key_hash = hashlib.sha256(secrets.token_hex(32).encode()).hexdigest()
        db_obj = APIKey(
            user_id=obj_in.user_id,
            name=obj_in.name,
            scopes=obj_in.scopes,
            expires_at=obj_in.expires_at,
            key_hash=key_hash,
        )
        db.add(db_obj)
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            raise DuplicateKeyError(self.tablename, e.orig)
        db.refresh(db_obj)
        return db_obj


api_keys_crud = APIKeyCRUD(APIKey)
