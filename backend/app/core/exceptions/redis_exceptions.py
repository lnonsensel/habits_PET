from app.core.exceptions.base_exception import AppError


class RateLimitExceededError(AppError):
    status_code = 429
    detail = "Too many requests, please try again later"


class LockNotAcquiredError(AppError):
    status_code = 409
    detail = "Resource is currently locked, please try again"
