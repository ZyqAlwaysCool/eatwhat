from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.api.core.settings import get_settings
from app.api.main import create_app
from tests.auth_helpers import login_headers


def test_history_endpoint_returns_empty_list(tmp_path: Path) -> None:
    store_path = tmp_path / "history.json"

    try:
        os.environ["HISTORY_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.get("/history", headers=headers)
    finally:
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0}


def test_feedback_endpoint_records_history(tmp_path: Path) -> None:
    store_path = tmp_path / "history.json"

    try:
        os.environ["HISTORY_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        create_response = client.post(
            "/decisions/feedback",
            json={
                "action": "accepted",
                "title": "阿姨盖饭",
                "description": "命中了当前口味偏好。",
                "candidate": None,
                "matched_taste_tag_ids": ["rice"],
                "applied_scene_tag_ids": ["near-office"],
                "applied_budget_id": "budget-0-30",
                "applied_dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
        list_response = client.get("/history", headers=headers)
    finally:
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert create_response.status_code == 201
    created_item = create_response.json()["item"]
    assert created_item["action"] == "accepted"
    assert created_item["title"] == "阿姨盖饭"

    payload = list_response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["matched_taste_tag_ids"] == ["rice"]
    assert payload["items"][0]["applied_scene_tag_ids"] == ["near-office"]


def test_feedback_endpoint_records_too_expensive_action(tmp_path: Path) -> None:
    store_path = tmp_path / "history.json"

    try:
        os.environ["HISTORY_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        create_response = client.post(
            "/decisions/feedback",
            json={
                "action": "too_expensive",
                "title": "周末火锅",
                "description": "这次预算有点超了。",
                "candidate": None,
                "matched_taste_tag_ids": ["spicy"],
                "applied_scene_tag_ids": ["weekend"],
                "applied_budget_id": "budget-60-100",
                "applied_dining_mode_ids": ["dine-in"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert create_response.status_code == 201
    assert create_response.json()["item"]["action"] == "too_expensive"


def test_feedback_endpoint_deduplicates_active_correction_action(
    tmp_path: Path,
) -> None:
    history_store_path = tmp_path / "history.json"
    candidate_store_path = tmp_path / "candidates.json"

    try:
        os.environ["HISTORY_STORE_PATH"] = str(history_store_path)
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        first_response = client.post(
            "/decisions/feedback",
            json={
                "action": "disliked",
                "title": "测试店铺3",
                "description": "这次先不想吃它。",
                "candidate": {
                    "id": "candidate-3",
                    "name": "测试店铺3",
                    "note": None,
                    "cuisine_ids": ["cuisine-burger"],
                    "taste_tag_ids": [],
                    "scene_tag_ids": [],
                    "budget_id": None,
                    "dining_mode_ids": [],
                    "created_at": "2026-03-29T12:10:00Z",
                },
                "matched_taste_tag_ids": [],
                "applied_scene_tag_ids": [],
                "applied_dining_mode_ids": [],
            },
            headers=headers,
        )
        second_response = client.post(
            "/decisions/feedback",
            json={
                "action": "disliked",
                "title": "测试店铺3",
                "description": "这次先不想吃它。",
                "candidate": {
                    "id": "candidate-3",
                    "name": "测试店铺3",
                    "note": None,
                    "cuisine_ids": ["cuisine-burger"],
                    "taste_tag_ids": [],
                    "scene_tag_ids": [],
                    "budget_id": None,
                    "dining_mode_ids": [],
                    "created_at": "2026-03-29T12:10:00Z",
                },
                "matched_taste_tag_ids": [],
                "applied_scene_tag_ids": [],
                "applied_dining_mode_ids": [],
            },
            headers=headers,
        )
        list_response = client.get("/history", headers=headers)
    finally:
        os.environ.pop("HISTORY_STORE_PATH", None)
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert second_response.json()["item"]["id"] == first_response.json()["item"]["id"]
    assert list_response.json()["total"] == 1
