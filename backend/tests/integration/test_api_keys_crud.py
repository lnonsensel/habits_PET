from uuid import uuid4
from tests.integration.test_habits_crud import create_test_user


def api_key_payload(user_id=None):
    payload = {
        "name": f"test-key-{uuid4().hex[:8]}",
        "scopes": {"read": True, "write": False},
    }
    if user_id:
        payload["user_id"] = user_id
    return payload


# ------------------------------------------------------------
# Test CRUD operations for /api_keys
# ------------------------------------------------------------
def test_create_api_key(client, db_session):
    user_id = create_test_user(db_session)
    payload = api_key_payload(user_id)
    response = client.post("/api_keys/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["scopes"] == payload["scopes"]
    assert data["user_id"] == user_id
    assert data["revoked_at"] is None
    assert "id" in data
    assert "created_at" in data


def test_create_api_key_missing_name(client, db_session):
    user_id = create_test_user(db_session)
    payload = api_key_payload(user_id)
    payload.pop("name")
    response = client.post("/api_keys/", json=payload)
    assert response.status_code == 422


def test_get_api_keys_empty(client, db_session):
    response = client.get("/api_keys/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_api_keys_list(client, db_session):
    user_id = create_test_user(db_session)
    key1 = client.post("/api_keys/", json=api_key_payload(user_id)).json()
    key2 = client.post("/api_keys/", json=api_key_payload(user_id)).json()
    response = client.get("/api_keys/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == key1["id"]
    assert data[1]["id"] == key2["id"]


def test_get_one_api_key(client, db_session):
    user_id = create_test_user(db_session)
    key = client.post("/api_keys/", json=api_key_payload(user_id)).json()
    key_id = key["id"]
    response = client.get(f"/api_keys/{key_id}")
    assert response.status_code == 200
    assert response.json()["id"] == key_id
    assert response.json()["name"] == key["name"]


def test_get_one_api_key_not_found(client):
    response = client.get(f"/api_keys/{uuid4()}")
    assert response.status_code == 404


def test_update_api_key(client, db_session):
    user_id = create_test_user(db_session)
    key = client.post("/api_keys/", json=api_key_payload(user_id)).json()
    key_id = key["id"]

    update_payload = {"name": "renamed-key"}
    response = client.put(f"/api_keys/{key_id}", json=update_payload)

    # -- ASSERT RESPONSE FROM UPDATE REQUEST --
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == "renamed-key"
    assert updated["scopes"] == key["scopes"]

    # -- ASSERT CHECK IF API KEY UPDATED --
    response = client.get(f"/api_keys/{key_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "renamed-key"


def test_update_api_key_not_found(client):
    response = client.put(f"/api_keys/{uuid4()}", json={"name": "new-name"})
    assert response.status_code == 404


def test_delete_api_key(client, db_session):
    user_id = create_test_user(db_session)
    key = client.post("/api_keys/", json=api_key_payload(user_id)).json()
    key_id = key["id"]

    get_resp = client.get(f"/api_keys/{key_id}")
    assert get_resp.status_code == 200

    del_resp = client.delete(f"/api_keys/{key_id}")
    assert del_resp.status_code == 200

    get_again = client.get(f"/api_keys/{key_id}")
    assert get_again.status_code == 404


def test_delete_api_key_not_found(client):
    response = client.delete(f"/api_keys/{uuid4()}")
    assert response.status_code == 404
