from app.core.exceptions.base_exception import AppError


class CRUDError(AppError):
    status_code = 500
    detail = "CRUD operation failed"

    def __init__(self, model_name: str, id_: int | str | None = None):
        id_ = str(id_) or "unknown"
        self.__class__.detail = f"{model_name}, id = {id_}" + self.__class__.detail
        super().__init__()


class ObjectNotFoundError(CRUDError):
    status_code = 404
    detail = "Object not found"


class DuplicateKeyError(CRUDError):
    status_code = 409
    detail = "Duplicate key violation"
