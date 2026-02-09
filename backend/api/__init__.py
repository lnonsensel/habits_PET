from fastapi import FastAPI

app = FastAPI()

from api.base_endpoints import base_endpoints

app.include_router(base_endpoints)
