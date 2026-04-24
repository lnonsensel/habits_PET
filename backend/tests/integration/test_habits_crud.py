import pytest
from uuid import uuid4
from app.models.user import User
from app.schemas.habits import HabitCreate
from app.schemas.users import UserCreate


# ------------------------------------------------------------
# Helper to create a test user and return its ID
# ------------------------------------------------------------
def create_test_user(db_session) -> str:
    user_data = UserCreate(
        email=f"test_{uuid4()}@example.com",
        password="testpass123",
        auth_provider="local",
        timezone="UTC",
        locale="en",
    )
    db_user = User(
        email=user_data.email,
        password_hash="fake_hash",
        auth_provider=user_data.auth_provider,
        timezone=user_data.timezone,
        locale=user_data.locale,
    )
    db_session.add(db_user)
    db_session.commit()
    db_session.refresh(db_user)
    return str(db_user.id)


# ------------------------------------------------------------
# Test CRUD operations for /habits
# ------------------------------------------------------------
def test_create_habit(client, db_session):
    user_id = create_test_user(db_session)
    payload = {
        "user_id": user_id,
        "name": "Morning Run",
        "description": "Run 5 km every morning",
        "unit": "km",
        "periodicity": "daily",
        "target_value": 5.0,
    }
    response = client.post("/habits/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Morning Run"
    assert data["user_id"] == user_id
    assert "id" in data
    assert "created_at" in data
    assert "archived_at" is None


def test_create_habit_missing_required_field(client, db_session):
    user_id = create_test_user(db_session)
    payload = {
        "user_id": user_id,
        "name": "Incomplete Habit",
        # missing "unit" and "periodicity"
    }
    response = client.post("/habits/", json=payload)
    assert response.status_code == 422


def test_get_habits_empty(client, db_session):
    # No habits yet
    response = client.get("/habits/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_habits_list(client, db_session):
    user_id = create_test_user(db_session)
    # Create two habits
    habit1 = client.post(
        "/habits/",
        json={
            "user_id": user_id,
            "name": "Habit 1",
            "unit": "times",
            "periodicity": "daily",
        },
    ).json()
    habit2 = client.post(
        "/habits/",
        json={
            "user_id": user_id,
            "name": "Habit 2",
            "unit": "hours",
            "periodicity": "weekly",
        },
    ).json()
    response = client.get("/habits/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == habit1["id"]
    assert data[1]["id"] == habit2["id"]


def test_get_one_habit(client, db_session):
    user_id = create_test_user(db_session)
    create_resp = client.post(
        "/habits/",
        json={
            "user_id": user_id,
            "name": "Read book",
            "unit": "pages",
            "periodicity": "daily",
        },
    )
    habit_id = create_resp.json()["id"]
    response = client.get(f"/habits/{habit_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Read book"


def test_get_one_habit_not_found(client):
    random_id = str(uuid4())
    response = client.get(f"/habits/{random_id}")
    assert response.status_code == 404


def test_update_habit(client, db_session):
    user_id = create_test_user(db_session)
    create_resp = client.post(
        "/habits/",
        json={
            "user_id": user_id,
            "name": "Old Name",
            "unit": "km",
            "periodicity": "daily",
        },
    )
    habit_id = create_resp.json()["id"]
    # Update name and target_value
    update_payload = {"name": "New Name", "target_value": 10.0}
    response = client.put(f"/habits/{habit_id}", json=update_payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == "New Name"
    assert updated["target_value"] == "10.0"  # Decimal comes as string in JSON
    # Other fields unchanged
    assert updated["unit"] == "km"


def test_update_habit_not_found(client):
    random_id = str(uuid4())
    response = client.put(f"/habits/{random_id}", json={"name": "New Name"})
    assert response.status_code == 404


def test_delete_habit(client, db_session):
    user_id = create_test_user(db_session)
    create_resp = client.post(
        "/habits/",
        json={
            "user_id": user_id,
            "name": "To Be Deleted",
            "unit": "times",
            "periodicity": "daily",
        },
    )
    habit_id = create_resp.json()["id"]
    # Check it exists
    get_resp = client.get(f"/habits/{habit_id}")
    assert get_resp.status_code == 200
    # Delete
    del_resp = client.delete(f"/habits/{habit_id}")
    assert del_resp.status_code == 200
    # Verify gone
    get_again = client.get(f"/habits/{habit_id}")
    assert get_again.status_code == 404


def test_delete_habit_not_found(client):
    random_id = str(uuid4())
    response = client.delete(f"/habits/{random_id}")
    assert response.status_code == 404
