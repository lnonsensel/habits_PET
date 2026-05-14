import traceback
import time

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.config import collect_fastapi_params
from app.core.exceptions.exception_handlers import app_error_handler
from app.core.exceptions import AppError
from app.core.logger import logger
from app.routers import routers

app = FastAPI(**collect_fastapi_params())

# ── Exception handlers ───────────────────────────────────────────
app.add_exception_handler(AppError, app_error_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s\n%s",
        request.method,
        request.url,
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


# ── Request logging middleware ───────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d  (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# ── Routers ──────────────────────────────────────────────────────
for router in routers:
    app.include_router(router)
