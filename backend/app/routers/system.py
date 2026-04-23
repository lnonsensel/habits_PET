from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_session

system_router = APIRouter(tags=["System"])


@system_router.get("/health", summary="System healthcheck")
async def healthcheck():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@system_router.get("/health/db", summary="Database healthcheck")
def db_health_check(db: Session = Depends(get_session)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "detail": str(e)}
