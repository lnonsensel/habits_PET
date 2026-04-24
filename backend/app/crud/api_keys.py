from app.crud.base import CRUDBase

from app.models.api_key import APIKey
from app.schemas.api_keys import APIKeyCreate, APIKeyUpdate


class APIKeyCRUD(CRUDBase[APIKey, APIKeyCreate, APIKeyUpdate]):
    pass


api_keys_crud = APIKeyCRUD(APIKey)
