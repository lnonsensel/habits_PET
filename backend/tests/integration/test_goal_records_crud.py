from uuid import uuid4
from tests.integration.test_goals_crud import create_test_habit, get_sample_goal


def create_test_goal(client, db_session) -> str:
    user_id, habit_id = create_test_habit(db_session)
    resp = client.post("/goals/", json=get_sample_goal(user_id, habit_id))
    return resp.json()["id"]


def goal_record_payload(goal_id):
    return {
        "goal_id": goal_id,
        "value": 42,
        "source": "manual",
    }


# ------------------------------------------------------------
# Test CRUD operations for /goal_records
# ------------------------------------------------------------
def test_create_goal_record(client, db_session):
    goal_id = create_test_goal(client, db_session)
    payload = goal_record_payload(goal_id)
    response = client.post("/goal_records/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["goal_id"] == goal_id
    assert data["value"] == 42
    assert data["source"] == "manual"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_goal_record_missing_required_field(client, db_session):
    goal_id = create_test_goal(client, db_session)
    payload = goal_record_payload(goal_id)
    payload.pop("value")
    response = client.post("/goal_records/", json=payload)
    assert response.status_code == 422


def test_get_goal_records_empty(client, db_session):
    response = client.get("/goal_records/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_goal_records_list(client, db_session):
    goal_id = create_test_goal(client, db_session)
    record1 = client.post("/goal_records/", json=goal_record_payload(goal_id)).json()
    record2 = client.post(
        "/goal_records/", json={**goal_record_payload(goal_id), "value": 100}
    ).json()
    response = client.get("/goal_records/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == record1["id"]
    assert data[1]["id"] == record2["id"]


def test_get_one_goal_record(client, db_session):
    goal_id = create_test_goal(client, db_session)
    record = client.post("/goal_records/", json=goal_record_payload(goal_id)).json()
    record_id = record["id"]
    response = client.get(f"/goal_records/{record_id}")
    assert response.status_code == 200
    assert response.json()["id"] == record_id
    assert response.json()["value"] == 42


def test_get_one_goal_record_not_found(client):
    response = client.get(f"/goal_records/{uuid4()}")
    assert response.status_code == 404


def test_update_goal_record(client, db_session):
    goal_id = create_test_goal(client, db_session)
    record = client.post("/goal_records/", json=goal_record_payload(goal_id)).json()
    record_id = record["id"]

    update_payload = {"value": 99, "source": "api"}
    response = client.put(f"/goal_records/{record_id}", json=update_payload)

    # -- ASSERT RESPONSE FROM UPDATE REQUEST --
    assert response.status_code == 200
    updated = response.json()
    assert updated["value"] == 99
    assert updated["source"] == "api"
    assert updated["goal_id"] == goal_id

    # -- ASSERT CHECK IF GOAL RECORD UPDATED --
    response = client.get(f"/goal_records/{record_id}")
    assert response.status_code == 200
    updated = response.json()
    assert updated["value"] == 99
    assert updated["source"] == "api"


def test_update_goal_record_not_found(client):
    response = client.put(f"/goal_records/{uuid4()}", json={"value": 1})
    assert response.status_code == 404


def test_delete_goal_record(client, db_session):
    goal_id = create_test_goal(client, db_session)
    record = client.post("/goal_records/", json=goal_record_payload(goal_id)).json()
    record_id = record["id"]

    get_resp = client.get(f"/goal_records/{record_id}")
    assert get_resp.status_code == 200

    del_resp = client.delete(f"/goal_records/{record_id}")
    assert del_resp.status_code == 200

    get_again = client.get(f"/goal_records/{record_id}")
    assert get_again.status_code == 404


def test_delete_goal_record_not_found(client):
    response = client.delete(f"/goal_records/{uuid4()}")
    assert response.status_code == 404
