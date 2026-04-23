from httpx import Auth
from app.core.exceptions.base_exception import AppError


class ServiceError(AppError):
    status_code = 400


# -- AUTH ERRORS --
class AuthenticationError(ServiceError):
    status_code = 400


class UserAlreadyExistsError(AuthenticationError):
    status_code = 400
    detail = "User with such email already exists"


class PasswordRequiredError(AuthenticationError):
    status_code = 422
    detail = "Password is required for registration"


class PasswordNotAllowedError(AuthenticationError):
    status_code = 400
    detail = "Password must not be provided for OAuth"
