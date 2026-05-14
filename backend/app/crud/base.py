import logging
from typing import Generic, TypeVar, Type, List, Optional, Any

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from pydantic import BaseModel

from app.core.exceptions.crud_exceptions import (
    DuplicateKeyError,
    ObjectNotFoundError,
    DatabaseError,
)

logger = logging.getLogger("habitpet.crud")

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model
        self.tablename = self.model.__tablename__

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        try:
            return db.query(self.model).filter(self.model.id == id).first()
        except SQLAlchemyError as e:
            logger.error("get %s id=%s: %s", self.tablename, id, e)
            raise DatabaseError(self.tablename, id)

    def get_multi(
        self, db: Session, skip: int = 0, limit: int = 100, **filters
    ) -> List[ModelType]:
        try:
            query = db.query(self.model)
            for key, value in filters.items():
                if value is not None and hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
            return query.offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            logger.error("get_multi %s filters=%s: %s", self.tablename, filters, e)
            raise DatabaseError(self.tablename, None)

    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            logger.warning("create %s IntegrityError: %s", self.tablename, e.orig)
            raise DuplicateKeyError(self.tablename, e.orig)
        except SQLAlchemyError as e:
            db.rollback()
            logger.error("create %s SQLAlchemyError: %s", self.tablename, e)
            raise DatabaseError(self.tablename, None)
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, id: Any, obj_in: UpdateSchemaType) -> ModelType:
        db_obj = self.get(db, id)
        if not db_obj:
            raise ObjectNotFoundError(self.tablename)
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        try:
            db.commit()
        except SQLAlchemyError as e:
            db.rollback()
            logger.error("update %s id=%s: %s", self.tablename, id, e)
            raise DatabaseError(self.tablename, id)
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: Any) -> ModelType:
        db_obj = self.get(db, id)
        if not db_obj:
            raise ObjectNotFoundError(self.tablename, id)
        db.delete(db_obj)
        try:
            db.commit()
        except SQLAlchemyError as e:
            db.rollback()
            logger.error("delete %s id=%s: %s", self.tablename, id, e)
            raise DatabaseError(self.tablename, id)
        return db_obj
