import pytest
import fakeredis.aioredis
from testcontainers.redis import RedisContainer


@pytest.fixture
async def fake_redis():
    r = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield r
    await r.aclose()


@pytest.fixture(scope="session")
def redis_container():
    with RedisContainer(image="redis:8.4-alpine", password="testpassword") as container:
        yield container
