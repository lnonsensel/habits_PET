import pytest
from app.services.redis.locks import LockService
from app.core.exceptions.redis_exceptions import LockNotAcquiredError


@pytest.fixture
def locks(fake_redis):
    return LockService(fake_redis)


async def test_lock_acquired_and_released(locks, fake_redis):
    async with locks.acquire("resource:1"):
        assert await fake_redis.exists("lock:resource:1")
    assert not await fake_redis.exists("lock:resource:1")


async def test_double_lock_raises(locks):
    async with locks.acquire("resource:2"):
        with pytest.raises(LockNotAcquiredError):
            async with locks.acquire("resource:2"):
                pass


async def test_lock_released_after_exception(locks, fake_redis):
    with pytest.raises(ValueError):
        async with locks.acquire("resource:3"):
            raise ValueError("something went wrong")
    assert not await fake_redis.exists("lock:resource:3")


async def test_lock_not_released_if_stolen(locks, fake_redis):
    """If another holder overwrites the key, we must not delete their lock."""
    async with locks.acquire("resource:4"):
        # Simulate the lock being taken over (e.g. TTL expired and re-acquired)
        await fake_redis.set("lock:resource:4", "stolen-token")
    # The lock should still be present since we didn't own it
    assert await fake_redis.exists("lock:resource:4")


async def test_different_resources_are_independent(locks):
    async with locks.acquire("resource:A"):
        async with locks.acquire("resource:B"):
            pass  # both should succeed without conflict
