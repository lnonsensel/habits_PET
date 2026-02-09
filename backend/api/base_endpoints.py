from fastapi import Response
from fastapi import APIRouter
from datetime import datetime

base_endpoints = APIRouter()


@base_endpoints.get("/health")
async def healthcheck():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
