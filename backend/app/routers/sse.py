import asyncio
import contextlib
import json
from typing import AsyncGenerator
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.models.enums import NotificationEvent
from app.services.redis.client import get_redis

sse_router = APIRouter(prefix="/notifications", tags=["SSE"])

_KEEPALIVE_INTERVAL = 30   # seconds
_DISCONNECT_POLL = 0.5     # how often to check client disconnect
_CHANNEL_PREFIX = "sse:notifications"


def _channel(user_id: str) -> str:
    return f"{_CHANNEL_PREFIX}:{user_id}"


async def _stream(request: Request, user_id: str, redis: aioredis.Redis) -> AsyncGenerator[str, None]:
    """
    Yields SSE-formatted strings until the client disconnects.

    Two background tasks run concurrently:
    - _reader: subscribes to Redis pub/sub and enqueues incoming messages
    - _watcher: polls request.is_disconnected() and sets the stop event

    The generator drains the queue with a keepalive timeout. When the stop
    event fires (client gone), the loop exits and both tasks are cancelled.
    """
    queue: asyncio.Queue[str] = asyncio.Queue()
    stop = asyncio.Event()

    async def _reader() -> None:
        pubsub = redis.pubsub()
        await pubsub.subscribe(_channel(user_id))
        try:
            async for raw in pubsub.listen():
                if stop.is_set():
                    break
                if raw["type"] == "message":
                    await queue.put(raw["data"])
        finally:
            with contextlib.suppress(Exception):
                await pubsub.unsubscribe(_channel(user_id))
                await pubsub.aclose()

    async def _watcher() -> None:
        while not await request.is_disconnected():
            await asyncio.sleep(_DISCONNECT_POLL)
        stop.set()

    reader = asyncio.create_task(_reader())
    watcher = asyncio.create_task(_watcher())

    try:
        while not stop.is_set():
            try:
                data = await asyncio.wait_for(queue.get(), timeout=_KEEPALIVE_INTERVAL)
                yield f"data: {data}\n\n"
            except asyncio.TimeoutError:
                if not stop.is_set():
                    yield ": keepalive\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        stop.set()
        watcher.cancel()
        reader.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await asyncio.gather(reader, watcher, return_exceptions=True)


@sse_router.get(
    "/stream/{user_id}",
    summary="Subscribe to real-time notifications via SSE",
    response_class=StreamingResponse,
)
async def stream_notifications(
    user_id: UUID,
    request: Request,
    redis: aioredis.Redis = Depends(get_redis),
) -> StreamingResponse:
    return StreamingResponse(
        _stream(request, str(user_id), redis),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


class PublishRequest(BaseModel):
    user_id: UUID
    event: NotificationEvent
    payload: dict = Field(default_factory=dict)


@sse_router.post(
    "/publish",
    summary="Publish a real-time notification to a user's SSE stream",
    status_code=204,
)
async def publish_notification(
    body: PublishRequest,
    redis: aioredis.Redis = Depends(get_redis),
) -> None:
    message = json.dumps({"event": body.event.value, "payload": body.payload})
    await redis.publish(_channel(str(body.user_id)), message)
