"""
Tests that Redis authentication works end-to-end with a real Redis container.
These catch misconfiguration where the password isn't properly passed to the server
(e.g. literal "${REDIS_PASSWORD}" instead of the actual value).
"""
import pytest
import redis.asyncio as aioredis
from redis.exceptions import AuthenticationError


def _make_client(host: str, port: str, password: str | None = None) -> aioredis.Redis:
    if password:
        url = f"redis://:{password}@{host}:{port}/0"
    else:
        url = f"redis://{host}:{port}/0"
    return aioredis.from_url(url, decode_responses=True)


async def test_ping_succeeds_with_correct_password(redis_container):
    host = redis_container.get_container_host_ip()
    port = redis_container.get_exposed_port(6379)
    client = _make_client(host, port, password="testpassword")
    assert await client.ping() is True
    await client.aclose()


async def test_auth_fails_with_wrong_password(redis_container):
    host = redis_container.get_container_host_ip()
    port = redis_container.get_exposed_port(6379)
    # Simulates what happens when docker-compose passes "${REDIS_PASSWORD}" literally
    client = _make_client(host, port, password="${REDIS_PASSWORD}")
    with pytest.raises(AuthenticationError):
        await client.ping()
    await client.aclose()


async def test_auth_fails_without_password(redis_container):
    host = redis_container.get_container_host_ip()
    port = redis_container.get_exposed_port(6379)
    client = _make_client(host, port, password=None)
    with pytest.raises(AuthenticationError):
        await client.ping()
    await client.aclose()


async def test_set_and_get_after_auth(redis_container):
    host = redis_container.get_container_host_ip()
    port = redis_container.get_exposed_port(6379)
    client = _make_client(host, port, password="testpassword")
    await client.set("smoke:key", "ok", ex=10)
    assert await client.get("smoke:key") == "ok"
    await client.aclose()
