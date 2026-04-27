from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.api.core.settings import get_settings
from app.api.main import create_app
from tests.auth_helpers import login_headers


def test_cuisines_endpoint_returns_empty_list(tmp_path: Path) -> None:
    store_path = tmp_path / "cuisines.json"

    try:
        os.environ["CUISINE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.get("/cuisines", headers=headers)
    finally:
        os.environ.pop("CUISINE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0}


def test_cuisines_endpoint_can_create_item(tmp_path: Path) -> None:
    store_path = tmp_path / "cuisines.json"

    try:
        os.environ["CUISINE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        create_response = client.post(
            "/cuisines",
            json={
                "title": "麻辣烫",
                "description": "更适合想吃热乎一点的时候",
                "taste_tag_ids": ["spicy", "spicy"],
                "dining_mode_ids": ["delivery", "delivery"],
            },
            headers=headers,
        )
        list_response = client.get("/cuisines", headers=headers)
    finally:
        os.environ.pop("CUISINE_STORE_PATH", None)
        get_settings.cache_clear()

    assert create_response.status_code == 201
    created_item = create_response.json()["item"]
    assert created_item["title"] == "麻辣烫"
    assert created_item["taste_tag_ids"] == ["spicy"]
    assert created_item["dining_mode_ids"] == ["delivery"]

    assert list_response.status_code == 200
    payload = list_response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["title"] == "麻辣烫"


def test_cuisines_endpoint_reuses_duplicate_title(tmp_path: Path) -> None:
    store_path = tmp_path / "cuisines.json"

    try:
        os.environ["CUISINE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)

        first_response = client.post(
            "/cuisines",
            json={
                "title": "拌饭",
                "description": "工作日更稳妥",
            },
            headers=headers,
        )
        second_response = client.post(
            "/cuisines",
            json={
                "title": "  拌饭  ",
                "description": "重复提交",
            },
            headers=headers,
        )
        list_response = client.get("/cuisines", headers=headers)
    finally:
        os.environ.pop("CUISINE_STORE_PATH", None)
        get_settings.cache_clear()

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert second_response.json()["item"]["id"] == first_response.json()["item"]["id"]
    assert list_response.json()["total"] == 1
