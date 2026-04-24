def test_register_local_success(client):
    response = client.post(
        "/auth/register/",
        json={
            "email": "test@example.com",
            "password": "secure12345",
            "auth_provider": "local",
            "timezone": "Europe/Moscow",
            "locale": "ru",
        },
    )
    assert response.status_code == 201, (
        f"Expected 201, got {response.status_code}. Response body: {response.text}"
    )
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["auth_provider"] == "local"
    assert data["timezone"] == "Europe/Moscow"
    assert data["locale"] == "ru"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["last_login_at"] is None
    assert "password" not in data
    assert "password_hash" not in data


def test_register_local_without_password(client):
    response = client.post(
        "/auth/register/",
        json={
            "email": "test@example.com",
            "auth_provider": "local",
            "timezone": "UTC",
            "locale": "en",
        },
    )
    assert response.status_code == 422


def test_register_local_with_short_password(client):
    response = client.post(
        "/auth/register/",
        json={
            "email": "test@example.com",
            "password": "short",
            "auth_provider": "local",
        },
    )
    assert response.status_code == 422  # min_length=8


def test_register_duplicate_email(client):
    client.post(
        "/auth/register/",
        json={
            "email": "duplicate@example.com",
            "password": "password123",
            "auth_provider": "local",
        },
    )

    response = client.post(
        "/auth/register/",
        json={
            "email": "duplicate@example.com",
            "password": "anotherpass",
            "auth_provider": "local",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "User with such email already exists"


def test_register_oauth_provider_without_password(client):
    response = client.post(
        "/auth/register/",
        json={
            "email": "oauth@example.com",
            "auth_provider": "google",
            # password отсутствует (что правильно)
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["auth_provider"] == "google"


def test_register_oauth_with_password(client):
    response = client.post(
        "/auth/register/",
        json={
            "email": "oauthpass@example.com",
            "password": "shouldnotbehere",
            "auth_provider": "google",
        },
    )
    assert response.status_code == 400
    assert "Password must not be provided" in response.json()["detail"]


def test_register_missing_email(client):
    response = client.post(
        "/auth/register/",
        json={
            "password": "somepass",
            "auth_provider": "local",
        },
    )
    assert response.status_code == 422


def test_register_invalid_email_format(client):
    response = client.post(
        "/auth/register/",
        json={
            "email": "notanemail",
            "password": "validpass123",
            "auth_provider": "local",
        },
    )
    assert response.status_code == 422


def test_register_default_timezone_locale(client):
    response = client.post(
        "/auth/register/",
        json={
            "email": "defaults@example.com",
            "password": "securepass",
            "auth_provider": "local",
            # timezone и locale не передаём
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["timezone"] == "UTC"
    assert data["locale"] == "en"
