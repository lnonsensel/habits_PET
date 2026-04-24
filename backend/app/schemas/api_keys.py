# app/schemas/api_key.py
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import time
from typing import Optional, Dict, Any


class APIKeyBase(BaseModel):
    name: str = Field(
        ..., max_length=255, description="Human‑readable name for the API key"
    )
    scopes: Dict[str, Any] = Field(
        default_factory=dict, description="Permissions/scope dictionary (JSON)"
    )
    expires_at: Optional[time] = Field(
        None,
        description="Expiration time (timezone‑aware). If not set, the key never expires",
    )


class APIKeyCreate(APIKeyBase):
    pass


class APIKeyResponse(APIKeyBase):
    id: UUID = Field(..., description="Unique API key identifier")
    user_id: UUID = Field(..., description="Owner of the key")
    created_at: time = Field(..., description="Creation timestamp (timezone‑aware)")
    revoked_at: Optional[time] = Field(
        None, description="Timestamp when the key was revoked, if any"
    )
    model_config = ConfigDict(from_attributes=True)


class APIKeyCreatedResponse(APIKeyResponse):
    key: str = Field(
        ...,
        description="The generated API key value – store it securely, it will not be shown again",
    )


class APIKeyUpdate(BaseModel):
    name: Optional[str] = Field(
        None, max_length=255, description="New name for the key"
    )
    revoked_at: Optional[time] = Field(
        None, description="Set to current time to revoke the key"
    )
    model_config = ConfigDict(extra="forbid")
