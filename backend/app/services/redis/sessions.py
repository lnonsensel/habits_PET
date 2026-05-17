import json
import uuid
from typing import Any

import redis.asyncio as aioredis

SESSION_TTL = 60 * 60 * 24 * 7  # 7 days


class SessionService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    def _key(self, session_id: str) -> str:
        return f"session:{session_id}"

    async def create(self, data: dict[str, Any]) -> str:
        session_id = str(uuid.uuid4())
        await self._r.set(self._key(session_id), json.dumps(data), ex=SESSION_TTL)
        return session_id

    async def get(self, session_id: str) -> dict[str, Any] | None:
        raw = await self._r.get(self._key(session_id))
        if raw is None:
            return None
        await self._r.expire(self._key(session_id), SESSION_TTL)  # sliding expiry
        return json.loads(raw)

    async def delete(self, session_id: str) -> None:
        await self._r.delete(self._key(session_id))
