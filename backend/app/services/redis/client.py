import os

import redis.asyncio as aioredis
from dotenv import load_dotenv

from app.core.logger import logger

load_dotenv(".redis.env")

_REDIS_URL = "redis://:{password}@{host}:{port}/0".format(
    password=os.getenv("REDIS_PASSWORD", ""),
    host=os.getenv("REDIS_HOST", "localhost"),
    port=os.getenv("REDIS_PORT", "6379"),
)

_client: aioredis.Redis | None = None


async def init_redis() -> None:
    global _client
    _client = aioredis.from_url(
        _REDIS_URL,
        decode_responses=True,
        max_connections=20,
    )
    await _client.ping()
    logger.info(
        "Redis connected: %s:%s",
        os.getenv("REDIS_HOST", "localhost"),
        os.getenv("REDIS_PORT", "6379"),
    )


async def close_redis() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None
        logger.info("Redis connection closed")


def get_redis() -> aioredis.Redis:
    if _client is None:
        raise RuntimeError("Redis client is not initialized")
    return _client
