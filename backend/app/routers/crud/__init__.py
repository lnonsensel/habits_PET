from app.routers.crud.users_crud import users_crud_router
from app.routers.crud.notifications_crud import notifications_crud_router
from app.routers.crud.habits_crud import habits_crud_router
from app.routers.crud.habit_records_crud import habit_records_crud_router
from app.routers.crud.goals_crud import goals_crud_router
from app.routers.crud.goal_records_crud import goal_records_crud_router
from app.routers.crud.api_keys_crud import api_keys_crud_router

crud_routers = [
    users_crud_router,
    notifications_crud_router,
    habits_crud_router,
    habit_records_crud_router,
    goals_crud_router,
    goal_records_crud_router,
    api_keys_crud_router,
]
