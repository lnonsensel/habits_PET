from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Type, List, Optional
from app.crud.base import CRUDBase
from app.core.database import get_session
from enum import Enum


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

    @router.post("/", response_model=response_schema, status_code=201)
    def create(obj_in: create_schema, db: Session = Depends(get_session)):
        return crud.create(db, obj_in)

    @router.get("/", response_model=List[response_schema])
    def read_multi(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
        return crud.get_multi(db, skip=skip, limit=limit)

    @router.get("/{item_id}", response_model=response_schema)
    def read_one(item_id: str, db: Session = Depends(get_session)):
        obj = crud.get(db, id=item_id)
        if not obj:
            raise HTTPException(404)
        return obj

    @router.put("/{item_id}", response_model=response_schema)
    def update(item_id: str, obj_in: update_schema, db: Session = Depends(get_session)):
        return crud.update(db, id=item_id, obj_in=obj_in)

    @router.delete("/{item_id}", response_model=response_schema)
    def delete(item_id: str, db: Session = Depends(get_session)):
        return crud.delete(db, id=item_id)

    return router
