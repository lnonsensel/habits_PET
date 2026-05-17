from enum import Enum
from typing import List, Optional, Type
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.crud.base import CRUDBase
from app.services.redis.cache import CacheService
from app.services.redis.client import get_redis


def create_crud_router(
    prefix: str,
    crud: CRUDBase,
    create_schema: Type,
    response_schema: Type,
    update_schema: Type,
    tags: Optional[list[str | Enum]] = None,
):
    if tags is None:
        tags = []
    router = APIRouter(prefix=prefix, tags=tags)
    cache_ns = prefix.strip("/")  # "habits", "goals", …

    @router.post("/", response_model=response_schema, status_code=201)
    async def create(
        obj_in: create_schema,
        db: Session = Depends(get_session),
        redis: aioredis.Redis = Depends(get_redis),
    ):
        result = crud.create(db, obj_in)
        await CacheService(redis).invalidate_prefix(f"{cache_ns}:list")
        return result

    @router.get("/", response_model=List[response_schema])
    async def read_multi(
        skip: int = 0,
        limit: int = 1000,
        user_id: Optional[UUID] = None,
        habit_id: Optional[UUID] = None,
        goal_id: Optional[UUID] = None,
        db: Session = Depends(get_session),
        redis: aioredis.Redis = Depends(get_redis),
    ):
        cache = CacheService(redis)
        key = f"{cache_ns}:list:{user_id}:{habit_id}:{goal_id}:{skip}:{limit}"
        cached = await cache.get(key)
        if cached is not None:
            return cached
        result = crud.get_multi(
            db, skip=skip, limit=limit,
            user_id=user_id, habit_id=habit_id, goal_id=goal_id,
        )
        serialized = [
            response_schema.model_validate(item).model_dump(mode="json")
            for item in result
        ]
        await cache.set(key, serialized, ttl=60)
        return result

    @router.get("/{item_id}", response_model=response_schema)
    async def read_one(
        item_id: str,
        db: Session = Depends(get_session),
        redis: aioredis.Redis = Depends(get_redis),
    ):
        cache = CacheService(redis)
        key = f"{cache_ns}:item:{item_id}"
        cached = await cache.get(key)
        if cached is not None:
            return cached
        obj = crud.get(db, id=item_id)
        if not obj:
            raise HTTPException(404)
        await cache.set(
            key,
            response_schema.model_validate(obj).model_dump(mode="json"),
            ttl=300,
        )
        return obj

    @router.put("/{item_id}", response_model=response_schema)
    async def update(
        item_id: str,
        obj_in: update_schema,
        db: Session = Depends(get_session),
        redis: aioredis.Redis = Depends(get_redis),
    ):
        result = crud.update(db, id=item_id, obj_in=obj_in)
        cache = CacheService(redis)
        await cache.delete(f"{cache_ns}:item:{item_id}")
        await cache.invalidate_prefix(f"{cache_ns}:list")
        return result

    @router.delete("/{item_id}", response_model=response_schema)
    async def delete(
        item_id: str,
        db: Session = Depends(get_session),
        redis: aioredis.Redis = Depends(get_redis),
    ):
        result = crud.delete(db, id=item_id)
        cache = CacheService(redis)
        await cache.delete(f"{cache_ns}:item:{item_id}")
        await cache.invalidate_prefix(f"{cache_ns}:list")
        return result

    return router
