import pytest
from unittest.mock import patch
from app.services.redis.rate_limit import RateLimitService
from app.core.exceptions.redis_exceptions import RateLimitExceededError


@pytest.fixture
def rate_limit(fake_redis):
    return RateLimitService(fake_redis)


async def test_first_request_returns_remaining(rate_limit):
    remaining = await rate_limit.check("user:1", limit=5, window=60)
    assert remaining == 4


async def test_remaining_decrements_per_request(rate_limit):
    for expected_remaining in [4, 3, 2]:
        remaining = await rate_limit.check("user:2", limit=5, window=60)
        assert remaining == expected_remaining


async def test_at_limit_raises(rate_limit):
    for _ in range(3):
        await rate_limit.check("user:3", limit=3, window=60)
    with pytest.raises(RateLimitExceededError):
        await rate_limit.check("user:3", limit=3, window=60)


async def test_different_keys_are_independent(rate_limit):
    await rate_limit.check("user:A", limit=1, window=60)
    # user:B has its own counter
    remaining = await rate_limit.check("user:B", limit=1, window=60)
    assert remaining == 0


async def test_window_expiry_resets_counter(rate_limit):
    import time
    now = time.time()

    with patch("app.services.redis.rate_limit.time") as mock_time:
        mock_time.time.return_value = now
        await rate_limit.check("user:5", limit=1, window=10)

        # Move past the window — old entries are expired
        mock_time.time.return_value = now + 11
        remaining = await rate_limit.check("user:5", limit=1, window=10)
        assert remaining == 0  # used 1/1 in new window


async def test_limit_of_one_allows_first_request(rate_limit):
    remaining = await rate_limit.check("user:6", limit=1, window=60)
    assert remaining == 0


async def test_limit_of_one_blocks_second_request(rate_limit):
    await rate_limit.check("user:7", limit=1, window=60)
    with pytest.raises(RateLimitExceededError):
        await rate_limit.check("user:7", limit=1, window=60)
