from app.crud.base import CRUDBase

from app.models.goal_record import GoalRecord
from app.schemas.goal_records import GoalRecordCreate, GoalRecordUpdate


class GoalRecordCRUD(CRUDBase[GoalRecord, GoalRecordCreate, GoalRecordUpdate]):
    pass


goal_records_crud = GoalRecordCRUD(GoalRecord)
