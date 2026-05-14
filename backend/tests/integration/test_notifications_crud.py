from uuid import uuid4
from tests.integration.test_habits_crud import create_test_user


def notification_payload(user_id):
    return {
        "user_id": user_id,
        "channel": "email",
        "event": "goal_completed",
        "scheduled_at": "12:00:00",
        "payload": {"message": "You completed a goal!"},
    }


# ------------------------------------------------------------
# Test CRUD operations for /notifications
# ------------------------------------------------------------
def test_create_notification(client, db_session):
    user_id = create_test_user(db_session)
    payload = notification_payload(user_id)
    response = client.post("/notifications/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["channel"] == "email"
    assert data["event"] == "goal_completed"
    assert data["user_id"] == user_id
    assert data["scheduled_at"].startswith("12:00:00")
    assert data["retry_count"] == 0
    assert data["sent_at"] is None
    assert "id" in data
    assert "created_at" in data


def test_create_notification_missing_required_field(client, db_session):
    user_id = create_test_user(db_session)
    payload = notification_payload(user_id)
    payload.pop("channel")
    response = client.post("/notifications/", json=payload)
    assert response.status_code == 422


def test_get_notifications_empty(client, db_session):
    response = client.get("/notifications/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_notifications_list(client, db_session):
    user_id = create_test_user(db_session)
    notif1 = client.post("/notifications/", json=notification_payload(user_id)).json()
    notif2 = client.post(
        "/notifications/",
        json={**notification_payload(user_id), "event": "daily_remainder"},
    ).json()
    response = client.get("/notifications/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == notif1["id"]
    assert data[1]["id"] == notif2["id"]


def test_get_one_notification(client, db_session):
    user_id = create_test_user(db_session)
    notif = client.post("/notifications/", json=notification_payload(user_id)).json()
    notif_id = notif["id"]
    response = client.get(f"/notifications/{notif_id}")
    assert response.status_code == 200
    assert response.json()["id"] == notif_id
    assert response.json()["channel"] == "email"


def test_get_one_notification_not_found(client):
    response = client.get(f"/notifications/{uuid4()}")
    assert response.status_code == 404


def test_update_notification(client, db_session):
    user_id = create_test_user(db_session)
    notif = client.post("/notifications/", json=notification_payload(user_id)).json()
    notif_id = notif["id"]

    update_payload = {"status": "sent", "sent_at": "13:00:00", "retry_count": 1}
    response = client.put(f"/notifications/{notif_id}", json=update_payload)

    # -- ASSERT RESPONSE FROM UPDATE REQUEST --
    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "sent"
    assert updated["sent_at"].startswith("13:00:00")
    assert updated["retry_count"] == 1
    assert updated["channel"] == notif["channel"]

    # -- ASSERT CHECK IF NOTIFICATION UPDATED --
    response = client.get(f"/notifications/{notif_id}")
    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "sent"
    assert updated["retry_count"] == 1


def test_update_notification_not_found(client):
    response = client.put(f"/notifications/{uuid4()}", json={"retry_count": 1})
    assert response.status_code == 404


def test_delete_notification(client, db_session):
    user_id = create_test_user(db_session)
    notif = client.post("/notifications/", json=notification_payload(user_id)).json()
    notif_id = notif["id"]

    get_resp = client.get(f"/notifications/{notif_id}")
    assert get_resp.status_code == 200

    del_resp = client.delete(f"/notifications/{notif_id}")
    assert del_resp.status_code == 200

    get_again = client.get(f"/notifications/{notif_id}")
    assert get_again.status_code == 404


def test_delete_notification_not_found(client):
    response = client.delete(f"/notifications/{uuid4()}")
    assert response.status_code == 404
