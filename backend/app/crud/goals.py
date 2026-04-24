from app.crud.base import CRUDBase

from app.models.goal import Goal
from app.schemas.goals import GoalCreate, GoalUpdate


class GoalCRUD(CRUDBase[Goal, GoalCreate, GoalUpdate]):
    pass


goals_crud = GoalCRUD(Goal)
