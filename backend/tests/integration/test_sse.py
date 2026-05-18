"""
SSE endpoint tests.

Потоковое соединение (/stream/{user_id}) не тестируется через HTTP-клиент:
httpx.ASGITransport ждёт завершения ASGI-вызова, а SSE-генератор бесконечен —
тест зависал бы. Вместо этого тестируем:
  - publish endpoint (sync client, немедленный ответ)
  - pub/sub round-trip (async unit, fakeredis)
  - 422 на невалидный user_id (FastAPI отвечает до вызова генератора)
"""
import json
from uuid import uuid4

import httpx
import pytest

from app.routers.sse import _channel
from app.services.redis.client import get_redis
from main import app


# ── Publish endpoint ─────────────────────────────────────────────


def test_publish_returns_204(client):
    response = client.post(
        "/notifications/publish",
        json={"user_id": str(uuid4()), "event": "goal_completed", "payload": {}},
    )
    assert response.status_code == 204


def test_publish_all_event_types(client):
    for event in ["goal_completed", "daily_remainder", "streak_lost", "summary_weekly"]:
        response = client.post(
            "/notifications/publish",
            json={"user_id": str(uuid4()), "event": event, "payload": {}},
        )
        assert response.status_code == 204, f"Failed for event '{event}'"


def test_publish_invalid_event_returns_422(client):
    response = client.post(
        "/notifications/publish",
        json={"user_id": str(uuid4()), "event": "nonexistent_event", "payload": {}},
    )
    assert response.status_code == 422


def test_publish_invalid_user_id_returns_422(client):
    response = client.post(
        "/notifications/publish",
        json={"user_id": "not-a-uuid", "event": "goal_completed", "payload": {}},
    )
    assert response.status_code == 422


def test_publish_without_payload_defaults_to_empty_dict(client):
    response = client.post(
        "/notifications/publish",
        json={"user_id": str(uuid4()), "event": "streak_lost"},
    )
    assert response.status_code == 204


# ── Stream endpoint — только валидация пути ──────────────────────
# FastAPI проверяет UUID до вызова хендлера, поэтому невалидный id
# возвращает 422 немедленно, не доходя до генератора.


async def test_stream_invalid_user_id_returns_422():
    app.dependency_overrides[get_redis] = lambda: None  # не нужен до генератора
    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as ac:
            response = await ac.get("/notifications/stream/not-a-uuid")
        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_redis, None)


# ── Pub/sub round-trip (unit level) ─────────────────────────────


async def test_publish_reaches_subscriber(fake_redis):
    user_id = str(uuid4())
    pubsub = fake_redis.pubsub()
    await pubsub.subscribe(_channel(user_id))

    message = json.dumps({"event": "goal_completed", "payload": {"x": 1}})
    await fake_redis.publish(_channel(user_id), message)

    async for raw in pubsub.listen():
        if raw["type"] == "message":
            assert json.loads(raw["data"]) == {"event": "goal_completed", "payload": {"x": 1}}
            break

    await pubsub.aclose()


async def test_channel_is_user_scoped(fake_redis):
    """Messages published to user A must not appear on user B's channel."""
    user_a, user_b = str(uuid4()), str(uuid4())

    pubsub_b = fake_redis.pubsub()
    await pubsub_b.subscribe(_channel(user_b))

    await fake_redis.publish(_channel(user_a), json.dumps({"event": "streak_lost", "payload": {}}))

    msg = await pubsub_b.get_message(ignore_subscribe_messages=True, timeout=0.1)
    assert msg is None, "User B должен получать только свои сообщения"

    await pubsub_b.aclose()


async def test_message_format_contains_event_and_payload(fake_redis):
    """Publish через HTTP endpoint форматирует сообщение корректно."""
    user_id = str(uuid4())
    pubsub = fake_redis.pubsub()
    await pubsub.subscribe(_channel(user_id))

    app.dependency_overrides[get_redis] = lambda: fake_redis
    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as ac:
            await ac.post(
                "/notifications/publish",
                json={"user_id": user_id, "event": "streak_lost", "payload": {"days": 7}},
            )
    finally:
        app.dependency_overrides.pop(get_redis, None)

    async for raw in pubsub.listen():
        if raw["type"] == "message":
            data = json.loads(raw["data"])
            assert data["event"] == "streak_lost"
            assert data["payload"] == {"days": 7}
            break

    await pubsub.aclose()
