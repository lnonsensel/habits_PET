import pytest
import fakeredis.aioredis
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app
from app.services.redis.client import get_redis


@pytest.fixture
def client(db_session):
    fake = fakeredis.aioredis.FakeRedis(decode_responses=True)
    app.dependency_overrides[get_redis] = lambda: fake

    with (
        patch("app.core.fastapi.init_redis", new_callable=AsyncMock),
        patch("app.core.fastapi.close_redis", new_callable=AsyncMock),
    ):
        with TestClient(app) as test_client:
            yield test_client

    app.dependency_overrides.pop(get_redis, None)
