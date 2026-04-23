from fastapi import FastAPI
from app.core.config import collect_fastapi_params
from app.core.exceptions.exception_handlers import app_error_handler
from app.core.exceptions import AppError

from app.routers import routers

app = FastAPI(**collect_fastapi_params())
# -- EXCEPTION HANDLERS --
app.add_exception_handler(AppError, app_error_handler)

# HERE LOGIC FROM app/routers
for router in routers:
    app.include_router(router)
