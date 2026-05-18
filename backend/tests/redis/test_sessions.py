import pytest
from app.services.redis.sessions import SessionService


@pytest.fixture
def sessions(fake_redis):
    return SessionService(fake_redis)


async def test_create_returns_session_id(sessions):
    sid = await sessions.create({"user_id": "abc"})
    assert isinstance(sid, str)
    assert len(sid) > 0


async def test_create_generates_unique_ids(sessions):
    sid1 = await sessions.create({"user_id": "u1"})
    sid2 = await sessions.create({"user_id": "u2"})
    assert sid1 != sid2


async def test_get_returns_stored_data(sessions):
    sid = await sessions.create({"user_id": "u1", "role": "admin"})
    data = await sessions.get(sid)
    assert data == {"user_id": "u1", "role": "admin"}


async def test_get_missing_session_returns_none(sessions):
    assert await sessions.get("nonexistent-session-id") is None


async def test_delete_removes_session(sessions):
    sid = await sessions.create({"user_id": "u1"})
    await sessions.delete(sid)
    assert await sessions.get(sid) is None


async def test_delete_nonexistent_session_is_safe(sessions):
    await sessions.delete("ghost-session")  # should not raise


async def test_get_refreshes_ttl(fake_redis, sessions):
    sid = await sessions.create({"user_id": "u1"})
    key = f"session:{sid}"

    ttl_before = await fake_redis.ttl(key)
    # TTL after get should be reset to SESSION_TTL (sliding expiry)
    await sessions.get(sid)
    ttl_after = await fake_redis.ttl(key)

    # Both should be close to SESSION_TTL; after get it's refreshed
    assert ttl_after >= ttl_before - 1


async def test_session_stores_complex_payload(sessions):
    payload = {
        "user_id": "u42",
        "permissions": ["read", "write"],
        "metadata": {"timezone": "UTC"},
    }
    sid = await sessions.create(payload)
    assert await sessions.get(sid) == payload
