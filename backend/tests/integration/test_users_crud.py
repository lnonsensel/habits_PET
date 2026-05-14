from uuid import uuid4


def create_user_payload(email=None):
    return {
        "email": email or f"user_{uuid4()}@example.com",
        "password": "testpass123",
        "auth_provider": "local",
        "timezone": "UTC",
        "locale": "en",
    }


# ------------------------------------------------------------
# Test CRUD operations for /users
# ------------------------------------------------------------
def test_create_user(client, db_session):
    payload = create_user_payload()
    response = client.post("/users/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["timezone"] == "UTC"
    assert data["locale"] == "en"
    assert data["auth_provider"] == "local"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["last_login_at"] is None
    assert "password" not in data
    assert "password_hash" not in data


def test_create_user_missing_email(client, db_session):
    response = client.post("/users/", json={"password": "testpass123", "auth_provider": "local"})
    assert response.status_code == 422


def test_create_user_invalid_email(client, db_session):
    payload = create_user_payload()
    payload["email"] = "notanemail"
    response = client.post("/users/", json=payload)
    assert response.status_code == 422


def test_get_users_empty(client, db_session):
    response = client.get("/users/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_users_list(client, db_session):
    user1 = client.post("/users/", json=create_user_payload()).json()
    user2 = client.post("/users/", json=create_user_payload()).json()
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == user1["id"]
    assert data[1]["id"] == user2["id"]


def test_get_one_user(client, db_session):
    user = client.post("/users/", json=create_user_payload()).json()
    user_id = user["id"]
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["id"] == user_id
    assert response.json()["email"] == user["email"]


def test_get_one_user_not_found(client):
    response = client.get(f"/users/{uuid4()}")
    assert response.status_code == 404


def test_update_user(client, db_session):
    user = client.post("/users/", json=create_user_payload()).json()
    user_id = user["id"]
    update_payload = {"timezone": "Europe/Moscow", "locale": "ru"}
    response = client.put(f"/users/{user_id}", json=update_payload)

    # -- ASSERT RESPONSE FROM UPDATE REQUEST --
    assert response.status_code == 200
    updated = response.json()
    assert updated["timezone"] == "Europe/Moscow"
    assert updated["locale"] == "ru"
    assert updated["email"] == user["email"]

    # -- ASSERT CHECK IF USER UPDATED --
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    updated = response.json()
    assert updated["timezone"] == "Europe/Moscow"
    assert updated["locale"] == "ru"


def test_update_user_not_found(client):
    response = client.put(f"/users/{uuid4()}", json={"timezone": "UTC"})
    assert response.status_code == 404


def test_delete_user(client, db_session):
    user = client.post("/users/", json=create_user_payload()).json()
    user_id = user["id"]

    get_resp = client.get(f"/users/{user_id}")
    assert get_resp.status_code == 200

    del_resp = client.delete(f"/users/{user_id}")
    assert del_resp.status_code == 200

    get_again = client.get(f"/users/{user_id}")
    assert get_again.status_code == 404


def test_delete_user_not_found(client):
    response = client.delete(f"/users/{uuid4()}")
    assert response.status_code == 404
