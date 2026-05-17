import time
from app.core.exceptions.redis_exceptions import RateLimitExceededError

import redis.asyncio as aioredis


class RateLimitService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    async def check(self, key: str, limit: int, window: int) -> int:
        """Sliding window rate limiter. Returns remaining requests. Raises if exceeded."""
        now = time.time()
        pipe = self._r.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window)
        results = await pipe.execute()
        count: int = results[2]
        if count > limit:
            raise RateLimitExceededError(
                f"Rate limit exceeded: {count}/{limit} in {window}s"
            )
        return limit - count
