import json
from typing import Any, AsyncGenerator

import redis.asyncio as aioredis


class PubSubService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    async def publish(self, channel: str, message: Any) -> None:
        await self._r.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str) -> AsyncGenerator[Any, None]:
        pubsub = self._r.pubsub()
        await pubsub.subscribe(channel)
        try:
            async for raw in pubsub.listen():
                if raw["type"] == "message":
                    yield json.loads(raw["data"])
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.aclose()
