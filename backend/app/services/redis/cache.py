import json
from typing import Any

import redis.asyncio as aioredis


class CacheService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    async def get(self, key: str) -> Any | None:
        value = await self._r.get(key)
        if value is None:
            return None
        return json.loads(value)

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        await self._r.set(key, json.dumps(value), ex=ttl)

    async def delete(self, key: str) -> None:
        await self._r.delete(key)

    async def exists(self, key: str) -> bool:
        return bool(await self._r.exists(key))

    async def invalidate_prefix(self, prefix: str) -> int:
        keys = await self._r.keys(f"{prefix}:*")
        if keys:
            return await self._r.delete(*keys)
        return 0
