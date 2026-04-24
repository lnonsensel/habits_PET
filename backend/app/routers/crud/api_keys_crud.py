from app.crud.router_factory import create_crud_router
from app.crud.api_keys import api_keys_crud
from app.schemas.api_keys import (
    APIKeyCreate,
    APIKeyResponse,
    APIKeyUpdate,
)

api_keys_crud_router = create_crud_router(
    prefix="/api_keys",
    crud=api_keys_crud,
    create_schema=APIKeyCreate,
    response_schema=APIKeyResponse,
    update_schema=APIKeyUpdate,
    tags=["APIKeys"],
)

# Create new endpoints for api_keys_crud_router
# @api_keys_crud_router.get()
