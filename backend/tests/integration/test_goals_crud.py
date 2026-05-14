from uuid import uuid4
from app.models.habit import Habit
from app.schemas.habits import HabitCreate

from tests.integration.test_habits_crud import create_test_user
from datetime import datetime
import time
import random
from string import ascii_lowercase


def create_test_habit(db_session):
    user_id = create_test_user(db_session)
    habit_data = HabitCreate(user_id=user_id, name="Sample Habit Name", unit="10.0")
    db_habit = Habit(**habit_data.model_dump())
    db_session.add(db_habit)
    db_session.commit()
    db_session.refresh(db_habit)
    return user_id, str(db_habit.id)


def get_sample_goal(user_id, habit_id):
    curtime = time.time()
    start_date = datetime.fromtimestamp(curtime).strftime("%Y-%m-%dT%H:%M:%SZ")
    end_date = datetime.fromtimestamp(curtime + random.randint(1, 5) * 3600).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    name = "".join([random.choice(ascii_lowercase) for _ in range(10)])
    description = "".join([random.choice(ascii_lowercase) for _ in range(10)])

    sample_goal = {
        "user_id": user_id,
        "name": name,
        "description": description,
        "habit_id": habit_id,
        "start_date": start_date,
        "end_date": end_date,
    }
    return sample_goal


# ------------------------------------------------------------
# Test CRUD operations for /goals
# ------------------------------------------------------------
def test_create_goal(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    payload = get_sample_goal(user_id, habit_id)
    response = client.post("/goals/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["user_id"] == user_id
    assert "id" in data
    assert "created_at" in data
    assert data["archived_at"] is None


def test_create_goal_missing_required_field(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    payload = get_sample_goal(user_id, habit_id)
    payload.pop("start_date")
    response = client.post("/goals/", json=payload)
    assert response.status_code == 422


def test_get_goals_empty(client, db_session):
    response = client.get("/goals/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_goals_list(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    goal1 = client.post(
        "/goals/",
        json=get_sample_goal(user_id, habit_id),
    ).json()
    goal2 = client.post(
        "/goals/",
        json=get_sample_goal(user_id, habit_id),
    ).json()
    response = client.get("/goals/")
    assert response.status_code == 200
    data = response.json()
    # print(data)
    assert len(data) == 2
    assert data[0]["id"] == goal1["id"]
    assert data[1]["id"] == goal2["id"]


def test_get_one_goal(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    sample_goal = get_sample_goal(user_id, habit_id)
    create_resp = client.post(
        "/goals/",
        json=sample_goal,
    )
    goal_id = create_resp.json()["id"]
    response = client.get(f"/goals/{goal_id}")
    assert response.status_code == 200
    assert response.json()["name"] == sample_goal["name"]


def test_get_one_goal_not_found(client):
    random_id = str(uuid4())
    response = client.get(f"/goals/{random_id}")
    assert response.status_code == 404


def test_update_goal(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    sample_goal = get_sample_goal(user_id, habit_id)
    create_resp = client.post(
        "/goals/",
        json=sample_goal,
    )
    goal_id = create_resp.json()["id"]
    # Update name and target_value
    update_payload = {"name": "New Name", "description": "New Description"}
    response = client.put(f"/goals/{goal_id}", json=update_payload)

    # -- ASSERT RESPONSE FROM UPDATE REQUEST --
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == "New Name"
    assert updated["description"] == "New Description"
    # Other fields unchanged
    assert updated["start_date"] == sample_goal["start_date"]

    # -- ASSERT CHECK IF GOAL UPDATED --
    response = client.get(f"/goals/{goal_id}")
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == "New Name"
    assert updated["description"] == "New Description"
    # Other fields unchanged
    assert updated["start_date"] == sample_goal["start_date"]


def test_update_goal_not_found(client):
    random_id = str(uuid4())
    response = client.put(f"/goals/{random_id}", json={"name": "New Name"})
    assert response.status_code == 404


def test_delete_goal(client, db_session):
    user_id, habit_id = create_test_habit(db_session)
    sample_goal = get_sample_goal(user_id, habit_id)
    create_resp = client.post(
        "/goals/",
        json=sample_goal,
    )
    goal_id = create_resp.json()["id"]
    # Check it exists
    get_resp = client.get(f"/goals/{goal_id}")
    assert get_resp.status_code == 200
    # Delete
    del_resp = client.delete(f"/goals/{goal_id}")
    assert del_resp.status_code == 200
    # Verify gone
    get_again = client.get(f"/goals/{goal_id}")
    assert get_again.status_code == 404


def test_delete_goal_not_found(client):
    random_id = str(uuid4())
    response = client.delete(f"/goals/{random_id}")
    assert response.status_code == 404
