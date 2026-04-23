from app.routers.auth import auth_router
from app.routers.system import system_router
from app.routers.crud import crud_routers

routers = [system_router, auth_router]
routers.extend(crud_routers)
