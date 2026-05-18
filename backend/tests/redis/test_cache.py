import pytest
from app.services.redis.cache import CacheService


@pytest.fixture
def cache(fake_redis):
    return CacheService(fake_redis)


async def test_get_missing_key_returns_none(cache):
    assert await cache.get("nonexistent") is None


async def test_set_and_get_roundtrip(cache):
    await cache.set("key", {"x": 1})
    assert await cache.get("key") == {"x": 1}


async def test_set_accepts_primitive_values(cache):
    await cache.set("num", 42)
    assert await cache.get("num") == 42

    await cache.set("flag", True)
    assert await cache.get("flag") is True

    await cache.set("lst", [1, 2, 3])
    assert await cache.get("lst") == [1, 2, 3]


async def test_delete_removes_key(cache):
    await cache.set("to_delete", "value")
    await cache.delete("to_delete")
    assert await cache.get("to_delete") is None


async def test_delete_nonexistent_key_is_safe(cache):
    await cache.delete("ghost")  # should not raise


async def test_exists_returns_true_for_present_key(cache):
    await cache.set("present", 1)
    assert await cache.exists("present") is True


async def test_exists_returns_false_for_missing_key(cache):
    assert await cache.exists("missing") is False


async def test_invalidate_prefix_removes_matching_keys(cache):
    await cache.set("user:1:habits", [1, 2])
    await cache.set("user:1:goals", [3, 4])
    await cache.set("user:2:habits", [5])

    removed = await cache.invalidate_prefix("user:1")
    assert removed == 2
    assert await cache.exists("user:1:habits") is False
    assert await cache.exists("user:1:goals") is False
    assert await cache.exists("user:2:habits") is True


async def test_invalidate_prefix_returns_zero_when_no_keys(cache):
    assert await cache.invalidate_prefix("empty_prefix") == 0


async def test_overwrite_existing_key(cache):
    await cache.set("k", "old")
    await cache.set("k", "new")
    assert await cache.get("k") == "new"
