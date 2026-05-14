from uuid import uuid4
from app.models.habit import Habit
from app.schemas.habits import HabitCreate
from tests.integration.test_habits_crud import create_test_user

def create_test_habit(db_session) -> tuple[str, str]:
    user_id = create_test_user(db_session)
    habit_data = HabitCreate(user_id=user_id, name="Test Habit", unit="times")
    db_habit = Habit(**habit_data.model_dump())
    db_session.add(db_habit)
    db_session.commit()
    db_session.refresh(db_habit)
    return user_id, str(db_habit.id)


def habit_record_payload(user_id, habit_id):
    return {
        "user_id": user_id,
        "habit_id": habit_id,
        "value": 3,
        "notes": "Feeling good today",
    }


# ------------------------------------------------------------
# Test CRUD operations for /habit_records
# ------------------------------------------------------------
def test_create_habit_record(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    payload = habit_record_payload(user_id, habit_id)
    response = client.post("/habit_records/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["habit_id"] == habit_id
    assert data["user_id"] == user_id
    assert data["value"] == 3
    assert data["notes"] == "Feeling good today"
    assert "id" in data
    assert "timestamp" in data


def test_create_habit_record_missing_required_field(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    payload = habit_record_payload(user_id, habit_id)
    payload.pop("value")
    response = client.post("/habit_records/", json=payload)
    assert response.status_code == 422


def test_get_habit_records_empty(client, db_session):
    response = client.get("/habit_records/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_habit_records_list(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    record1 = client.post("/habit_records/", json=habit_record_payload(user_id, habit_id)).json()
    record2 = client.post(
        "/habit_records/", json={**habit_record_payload(user_id, habit_id), "value": 5}
    ).json()
    response = client.get("/habit_records/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == record1["id"]
    assert data[1]["id"] == record2["id"]


def test_get_one_habit_record(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    record = client.post("/habit_records/", json=habit_record_payload(user_id, habit_id)).json()
    record_id = record["id"]
    response = client.get(f"/habit_records/{record_id}")
    assert response.status_code == 200
    assert response.json()["id"] == record_id
    assert response.json()["value"] == 3


def test_get_one_habit_record_not_found(client):
    response = client.get(f"/habit_records/{uuid4()}")
    assert response.status_code == 404


def test_update_habit_record(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    record = client.post("/habit_records/", json=habit_record_payload(user_id, habit_id)).json()
    record_id = record["id"]

    update_payload = {"value": 10, "notes": "Updated notes"}
    response = client.put(f"/habit_records/{record_id}", json=update_payload)

    # -- ASSERT RESPONSE FROM UPDATE REQUEST --
    assert response.status_code == 200
    updated = response.json()
    assert updated["value"] == 10
    assert updated["notes"] == "Updated notes"
    assert updated["habit_id"] == habit_id

    # -- ASSERT CHECK IF HABIT RECORD UPDATED --
    response = client.get(f"/habit_records/{record_id}")
    assert response.status_code == 200
    updated = response.json()
    assert updated["value"] == 10
    assert updated["notes"] == "Updated notes"


def test_update_habit_record_not_found(client):
    response = client.put(f"/habit_records/{uuid4()}", json={"value": 1})
    assert response.status_code == 404


def test_delete_habit_record(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    record = client.post("/habit_records/", json=habit_record_payload(user_id, habit_id)).json()
    record_id = record["id"]

    get_resp = client.get(f"/habit_records/{record_id}")
    assert get_resp.status_code == 200

    del_resp = client.delete(f"/habit_records/{record_id}")
    assert del_resp.status_code == 200

    get_again = client.get(f"/habit_records/{record_id}")
    assert get_again.status_code == 404


def test_delete_habit_record_not_found(client):
    response = client.delete(f"/habit_records/{uuid4()}")
    assert response.status_code == 404
