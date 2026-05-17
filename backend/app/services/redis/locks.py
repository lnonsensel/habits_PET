import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from app.core.exceptions.redis_exceptions import LockNotAcquiredError
import redis.asyncio as aioredis


class LockService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    @asynccontextmanager
    async def acquire(self, resource: str, ttl: int = 10) -> AsyncGenerator[None, None]:
        key = f"lock:{resource}"
        token = str(uuid.uuid4())
        acquired = await self._r.set(key, token, nx=True, ex=ttl)
        if not acquired:
            raise LockNotAcquiredError(f"Could not acquire lock on '{resource}'")
        try:
            yield
        finally:
            # Only release if we still own the lock
            current = await self._r.get(key)
            if current == token:
                await self._r.delete(key)
