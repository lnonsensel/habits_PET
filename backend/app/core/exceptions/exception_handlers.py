from fastapi.responses import JSONResponse
from app.core.exceptions.base_exception import AppError
from fastapi import Request


async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
