from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.api.core.settings import get_settings
from app.api.main import create_app
from tests.auth_helpers import login_headers


def test_candidates_endpoint_returns_empty_list(tmp_path: Path) -> None:
    store_path = tmp_path / "candidates.json"

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.get("/candidates", headers=headers)
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0}


def test_candidates_endpoint_can_create_item(tmp_path: Path) -> None:
    store_path = tmp_path / "candidates.json"

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        create_response = client.post(
            "/candidates",
            json={
                "name": "阿姨盖饭",
                "note": "工作日晚餐常吃",
                "cuisine_ids": ["cuisine-rice-bowl", "cuisine-rice-bowl"],
                "scene_tag_ids": ["near-office", "near-office"],
            },
            headers=headers,
        )
        list_response = client.get("/candidates", headers=headers)
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert create_response.status_code == 201
    created_item = create_response.json()["item"]
    assert created_item["name"] == "阿姨盖饭"
    assert created_item["note"] == "工作日晚餐常吃"
    assert created_item["cuisine_ids"] == ["cuisine-rice-bowl"]
    assert created_item["scene_tag_ids"] == ["near-office"]

    assert list_response.status_code == 200
    payload = list_response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["name"] == "阿姨盖饭"
    assert payload["items"][0]["cuisine_ids"] == ["cuisine-rice-bowl"]
    assert payload["items"][0]["scene_tag_ids"] == ["near-office"]


def test_candidates_endpoint_reuses_duplicate_name(tmp_path: Path) -> None:
    store_path = tmp_path / "candidates.json"

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)

        first_response = client.post(
            "/candidates", json={"name": "楼下粉面"}, headers=headers
        )
        second_response = client.post(
            "/candidates", json={"name": "  楼下粉面  "}, headers=headers
        )
        list_response = client.get("/candidates", headers=headers)
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert second_response.json()["item"]["id"] == first_response.json()["item"]["id"]
    assert list_response.json()["total"] == 1


def test_candidates_endpoint_deduplicates_existing_duplicate_records(
    tmp_path: Path,
) -> None:
    store_path = tmp_path / "candidates.json"
    store_path.write_text(
        """
        {
          "items": [
            {
              "id": "candidate-1",
              "name": "测试店铺3",
              "note": "旧记录",
              "taste_tag_ids": [],
              "scene_tag_ids": [],
              "dining_mode_ids": [],
              "created_at": "2026-03-29T12:00:00Z"
            },
            {
              "id": "candidate-2",
              "name": "  测试店铺3  ",
              "note": "新记录",
              "taste_tag_ids": [],
              "scene_tag_ids": [],
              "dining_mode_ids": [],
              "created_at": "2026-03-29T12:10:00Z"
            }
          ]
        }
        """,
        encoding="utf-8",
    )

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.get("/candidates", headers=headers)
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == "candidate-2"


def test_candidates_are_isolated_per_user(tmp_path: Path) -> None:
    store_path = tmp_path / "candidates.json"

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        user_a_headers = login_headers(client, device_id="device-a")
        user_b_headers = login_headers(client, device_id="device-b")

        create_response = client.post(
            "/candidates",
            json={"name": "用户 A 的店"},
            headers=user_a_headers,
        )
        list_response = client.get("/candidates", headers=user_b_headers)
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert create_response.status_code == 201
    assert list_response.status_code == 200
    assert list_response.json() == {"items": [], "total": 0}
