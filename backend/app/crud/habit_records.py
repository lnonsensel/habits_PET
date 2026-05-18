from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.enums import LogAction
from app.models.habit_record import HabitRecord
from app.schemas.habit_records import HabitRecordCreate, HabitRecordUpdate


class HabitRecordCRUD(CRUDBase[HabitRecord, HabitRecordCreate, HabitRecordUpdate]):
    def create(self, db: Session, obj_in: HabitRecordCreate) -> HabitRecord:
        record = super().create(db, obj_in)
        from app.crud.audit_logs import write_audit_log
        write_audit_log(
            db,
            user_id=record.user_id,
            event=LogAction.RECORD_ADDED,
            context={"habit_id": str(record.habit_id), "value": float(record.value)},
        )
        return record


habit_records_crud = HabitRecordCRUD(HabitRecord)
