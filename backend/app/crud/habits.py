from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.enums import LogAction
from app.models.habit import Habit
from app.schemas.habits import HabitCreate, HabitUpdate


class HabitCRUD(CRUDBase[Habit, HabitCreate, HabitUpdate]):
    def create(self, db: Session, obj_in: HabitCreate) -> Habit:
        habit = super().create(db, obj_in)
        from app.crud.audit_logs import write_audit_log
        write_audit_log(
            db,
            user_id=habit.user_id,
            event=LogAction.HABIT_CREATED,
            context={"habit_id": str(habit.id), "name": habit.name},
        )
        return habit


habits_crud = HabitCRUD(Habit)
