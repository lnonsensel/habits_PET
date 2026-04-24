from app.crud.base import CRUDBase

from app.models.habit_record import HabitRecord
from app.schemas.habit_records import HabitRecordCreate, HabitRecordUpdate


class HabitRecordCRUD(CRUDBase[HabitRecord, HabitRecordCreate, HabitRecordUpdate]):
    pass


habit_records_crud = HabitRecordCRUD(HabitRecord)
