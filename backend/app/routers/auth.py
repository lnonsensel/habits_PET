import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.schemas.users import LoginRequest, UserCreate, UserResponse
from app.services.auth.auth_service import AuthService
from app.services.redis.client import get_redis
from app.services.redis.rate_limit import RateLimitService

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post(
    "/register/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_session),
    redis: aioredis.Redis = Depends(get_redis),
):
    await RateLimitService(redis).check(
        key=f"rate:register:{request.client.host}",
        limit=5,
        window=600,  # 5 registrations per 10 minutes per IP
    )
    return await AuthService(db).register_user(user_data)


@auth_router.post(
    "/login/",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def login(
    credentials: LoginRequest,
    request: Request,
    db: Session = Depends(get_session),
    redis: aioredis.Redis = Depends(get_redis),
):
    await RateLimitService(redis).check(
        key=f"rate:login:{request.client.host}",
        limit=10,
        window=60,  # 10 attempts per minute per IP
    )
    return await AuthService(db).login_user(credentials.email, credentials.password)
