from __future__ import annotations

from fastapi.testclient import TestClient


def login_headers(
    client: TestClient,
    *,
    code: str = "mock-login-code",
    device_id: str = "device-a",
) -> dict[str, str]:
    response = client.post(
        "/auth/wechat/login",
        json={
            "code": code,
            "client_device_id": device_id,
        },
    )

    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
