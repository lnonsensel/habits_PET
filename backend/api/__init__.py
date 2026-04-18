from fastapi import FastAPI
from config import collect_fastapi_params

app = FastAPI(**collect_fastapi_params())

from api.base_endpoints import base_endpoints

app.include_router(base_endpoints)
