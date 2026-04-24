from app.crud.base import CRUDBase

from app.models.habit import Habit
from app.schemas.habits import HabitCreate, HabitUpdate


class HabitCRUD(CRUDBase[Habit, HabitCreate, HabitUpdate]):
    pass


habits_crud = HabitCRUD(Habit)
