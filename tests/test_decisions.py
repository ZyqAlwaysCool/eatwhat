from __future__ import annotations

import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path

from fastapi.testclient import TestClient

import app.api.services.decision as decision_service
from app.api.core.settings import get_settings
from app.api.main import create_app
from tests.auth_helpers import login_headers


def test_recommendation_returns_empty_when_pool_missing(tmp_path: Path) -> None:
    store_path = tmp_path / "candidates.json"

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post("/decisions/recommend", json={}, headers=headers)
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json()["mode"] == "empty"


def test_recommendation_falls_back_to_cuisine_when_pool_missing(
    monkeypatch, tmp_path: Path
) -> None:
    store_path = tmp_path / "candidates.json"

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "taste_tag_ids": ["rice"],
                "scene_tag_ids": ["near-office"],
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "empty"
    assert payload["title"] == "盖饭 / 简餐"
    assert payload["cuisine"] == {"id": "cuisine-rice-bowl", "title": "盖饭 / 简餐"}
    assert payload["matched_taste_tag_ids"] == ["rice"]
    assert payload["applied_scene_tag_ids"] == ["near-office"]


def test_recommendation_falls_back_to_custom_cuisine(
    monkeypatch, tmp_path: Path
) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    cuisine_store_path = tmp_path / "cuisines.json"
    cuisine_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "custom-cuisine-1",
                        "title": "麻辣拌",
                        "description": "更适合想吃辣又想快点解决的时候。",
                        "taste_tag_ids": ["spicy"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-30-60",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        os.environ["CUISINE_STORE_PATH"] = str(cuisine_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "taste_tag_ids": ["spicy"],
                "scene_tag_ids": ["near-office"],
                "budget_id": "budget-30-60",
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        os.environ.pop("CUISINE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "empty"
    assert payload["title"] == "麻辣拌"
    assert payload["cuisine"] == {"id": "custom-cuisine-1", "title": "麻辣拌"}
    assert payload["matched_taste_tag_ids"] == ["spicy"]


def test_recommendation_filters_by_cuisine_id(tmp_path: Path) -> None:
    store_path = tmp_path / "candidates.json"
    store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "阿姨盖饭",
                        "note": "工作日晚餐常吃",
                        "cuisine_ids": ["cuisine-rice-bowl"],
                        "taste_tag_ids": ["rice", "hot"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "楼下面馆",
                        "note": "备选项",
                        "cuisine_ids": ["cuisine-noodles"],
                        "taste_tag_ids": ["noodles", "hot"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "cuisine_ids": ["cuisine-noodles"],
                "budget_id": "budget-0-30",
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "楼下面馆"
    assert payload["matched_cuisine_ids"] == ["cuisine-noodles"]
    assert payload["applied_cuisine_ids"] == ["cuisine-noodles"]


def test_recommendation_excludes_candidates_without_requested_cuisine(
    tmp_path: Path,
) -> None:
    store_path = tmp_path / "candidates.json"
    store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "无品类店铺",
                        "note": "没有标品类",
                        "cuisine_ids": [],
                        "taste_tag_ids": ["hot"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "汉堡店",
                        "note": "命中品类",
                        "cuisine_ids": ["cuisine-burger"],
                        "taste_tag_ids": ["hot"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "cuisine_ids": ["cuisine-burger"],
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json()["title"] == "汉堡店"


def test_recommendation_filters_by_budget_and_dining_mode(
    monkeypatch, tmp_path: Path
) -> None:
    store_path = tmp_path / "candidates.json"
    store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "阿姨盖饭",
                        "note": "工作日晚餐常吃",
                        "taste_tag_ids": ["rice", "hot"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "周末火锅",
                        "note": "更适合到店",
                        "taste_tag_ids": ["spicy", "hot"],
                        "scene_tag_ids": ["weekend"],
                        "budget_id": "budget-60-100",
                        "dining_mode_ids": ["dine-in"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "taste_tag_ids": ["rice"],
                "scene_tag_ids": ["near-office"],
                "budget_id": "budget-0-30",
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "candidate"
    assert payload["title"] == "阿姨盖饭"
    assert payload["matched_taste_tag_ids"] == ["rice"]
    assert payload["applied_scene_tag_ids"] == ["near-office"]


def test_recommendation_excludes_candidates_without_requested_dining_mode(
    monkeypatch, tmp_path: Path
) -> None:
    store_path = tmp_path / "candidates.json"
    store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "未填写方式店铺",
                        "note": "不应被到店命中",
                        "taste_tag_ids": ["rice"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": [],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "到店汉堡",
                        "note": "可以到店",
                        "taste_tag_ids": ["rice"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["dine-in"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "scene_tag_ids": ["near-office"],
                "budget_id": "budget-0-30",
                "dining_mode_ids": ["dine-in"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json()["title"] == "到店汉堡"


def test_recommendation_filters_by_scene_tag(monkeypatch, tmp_path: Path) -> None:
    store_path = tmp_path / "candidates.json"
    store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "公司附近轻食",
                        "note": "午饭更方便",
                        "taste_tag_ids": ["light"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-30-60",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "周末火锅",
                        "note": "适合周末到店",
                        "taste_tag_ids": ["spicy"],
                        "scene_tag_ids": ["weekend"],
                        "budget_id": "budget-60-100",
                        "dining_mode_ids": ["dine-in"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "scene_tag_ids": ["weekend"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "周末火锅"
    assert payload["applied_scene_tag_ids"] == ["weekend"]


def test_recommendation_allows_wildcard_scene_and_dining_mode(
    monkeypatch, tmp_path: Path
) -> None:
    store_path = tmp_path / "candidates.json"
    store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "全天食堂",
                        "note": "场景和方式都不限制",
                        "taste_tag_ids": ["rice"],
                        "scene_tag_ids": ["no-limit"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["either"],
                        "created_at": "2026-03-29T12:00:00Z",
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "scene_tag_ids": ["weekend"],
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "全天食堂"
    assert payload["applied_scene_tag_ids"] == ["weekend"]
    assert payload["applied_dining_mode_ids"] == ["delivery"]


def test_recommendation_applies_too_expensive_weight(
    monkeypatch, tmp_path: Path
) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    history_store_path = tmp_path / "history.json"
    now = datetime.now(UTC)
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "周末火锅",
                        "note": "预算更高",
                        "taste_tag_ids": ["spicy"],
                        "scene_tag_ids": ["weekend"],
                        "budget_id": "budget-60-100",
                        "dining_mode_ids": ["dine-in"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "楼下粉面",
                        "note": "更稳妥",
                        "taste_tag_ids": ["spicy"],
                        "scene_tag_ids": ["weekend"],
                        "budget_id": "budget-30-60",
                        "dining_mode_ids": ["dine-in"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    history_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "history-1",
                        "action": "too_expensive",
                        "title": "周末火锅",
                        "description": "预算有点高",
                        "candidate": {
                            "id": "candidate-1",
                            "name": "周末火锅",
                            "note": "预算更高",
                            "taste_tag_ids": ["spicy"],
                            "scene_tag_ids": ["weekend"],
                            "budget_id": "budget-60-100",
                            "dining_mode_ids": ["dine-in"],
                            "created_at": "2026-03-29T12:00:00Z",
                        },
                        "matched_taste_tag_ids": ["spicy"],
                        "applied_scene_tag_ids": ["weekend"],
                        "applied_budget_id": "budget-60-100",
                        "applied_dining_mode_ids": ["dine-in"],
                        "created_at": (now - timedelta(hours=8)).isoformat(),
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        os.environ["HISTORY_STORE_PATH"] = str(history_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "taste_tag_ids": ["spicy"],
                "scene_tag_ids": ["weekend"],
                "dining_mode_ids": ["dine-in"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "楼下粉面"
    assert "已根据太贵了反馈，下调 1 个候选项权重。" in payload["rule_notes"]


def test_recommendation_filters_recently_accepted_items(
    monkeypatch, tmp_path: Path
) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    history_store_path = tmp_path / "history.json"
    now = datetime.now(UTC)
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "阿姨盖饭",
                        "note": "工作日晚餐常吃",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "楼下粉面",
                        "note": "备选项",
                        "taste_tag_ids": ["noodles"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    history_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "history-1",
                        "action": "accepted",
                        "title": "阿姨盖饭",
                        "description": "刚吃过",
                        "candidate": {
                            "id": "candidate-1",
                            "name": "阿姨盖饭",
                            "note": "工作日晚餐常吃",
                            "taste_tag_ids": ["rice"],
                            "budget_id": "budget-0-30",
                            "dining_mode_ids": ["delivery"],
                            "created_at": "2026-03-29T12:00:00Z",
                        },
                        "matched_taste_tag_ids": ["rice"],
                        "applied_budget_id": "budget-0-30",
                        "applied_dining_mode_ids": ["delivery"],
                        "created_at": (now - timedelta(hours=12)).isoformat(),
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        os.environ["HISTORY_STORE_PATH"] = str(history_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "budget_id": "budget-0-30",
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "楼下粉面"
    assert "已过滤最近 3 天内已接受的 1 个候选项。" in payload["rule_notes"]


def test_recommendation_applies_feedback_weight(monkeypatch, tmp_path: Path) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    history_store_path = tmp_path / "history.json"
    now = datetime.now(UTC)
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "阿姨盖饭",
                        "note": "工作日晚餐常吃",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "楼下粉面",
                        "note": "备选项",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    history_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "history-1",
                        "action": "skipped",
                        "title": "阿姨盖饭",
                        "description": "刚刚换掉",
                        "candidate": {
                            "id": "candidate-1",
                            "name": "阿姨盖饭",
                            "note": "工作日晚餐常吃",
                            "taste_tag_ids": ["rice"],
                            "budget_id": "budget-0-30",
                            "dining_mode_ids": ["delivery"],
                            "created_at": "2026-03-29T12:00:00Z",
                        },
                        "matched_taste_tag_ids": ["rice"],
                        "applied_budget_id": "budget-0-30",
                        "applied_dining_mode_ids": ["delivery"],
                        "created_at": (now - timedelta(hours=6)).isoformat(),
                    },
                    {
                        "id": "history-2",
                        "action": "accepted",
                        "title": "楼下粉面",
                        "description": "之前吃过且体验不错",
                        "candidate": {
                            "id": "candidate-2",
                            "name": "楼下粉面",
                            "note": "备选项",
                            "taste_tag_ids": ["rice"],
                            "budget_id": "budget-0-30",
                            "dining_mode_ids": ["delivery"],
                            "created_at": "2026-03-29T12:10:00Z",
                        },
                        "matched_taste_tag_ids": ["rice"],
                        "applied_budget_id": "budget-0-30",
                        "applied_dining_mode_ids": ["delivery"],
                        "created_at": (now - timedelta(days=7)).isoformat(),
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        os.environ["HISTORY_STORE_PATH"] = str(history_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "taste_tag_ids": ["rice"],
                "budget_id": "budget-0-30",
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "楼下粉面"
    assert "参考了历史接受反馈，提高了熟悉项权重。" in payload["rule_notes"]


def test_recommendation_filters_recent_ate_feedback(
    monkeypatch, tmp_path: Path
) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    history_store_path = tmp_path / "history.json"
    now = datetime.now(UTC)
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "阿姨盖饭",
                        "note": "工作日晚餐常吃",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "楼下粉面",
                        "note": "备选项",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    history_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "history-1",
                        "action": "ate_recently",
                        "title": "阿姨盖饭",
                        "description": "最近已经吃过",
                        "candidate": {
                            "id": "candidate-1",
                            "name": "阿姨盖饭",
                            "note": "工作日晚餐常吃",
                            "taste_tag_ids": ["rice"],
                            "budget_id": "budget-0-30",
                            "dining_mode_ids": ["delivery"],
                            "created_at": "2026-03-29T12:00:00Z",
                        },
                        "matched_taste_tag_ids": ["rice"],
                        "applied_budget_id": "budget-0-30",
                        "applied_dining_mode_ids": ["delivery"],
                        "created_at": (now - timedelta(days=1)).isoformat(),
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        os.environ["HISTORY_STORE_PATH"] = str(history_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={"budget_id": "budget-0-30", "dining_mode_ids": ["delivery"]},
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "楼下粉面"
    assert "已过滤最近 7 天内标记为最近吃过的 1 个候选项。" in payload["rule_notes"]


def test_recommendation_applies_disliked_weight(monkeypatch, tmp_path: Path) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    history_store_path = tmp_path / "history.json"
    now = datetime.now(UTC)
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "阿姨盖饭",
                        "note": "工作日晚餐常吃",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "楼下粉面",
                        "note": "备选项",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    history_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "history-1",
                        "action": "disliked",
                        "title": "阿姨盖饭",
                        "description": "最近不想再吃",
                        "candidate": {
                            "id": "candidate-1",
                            "name": "阿姨盖饭",
                            "note": "工作日晚餐常吃",
                            "taste_tag_ids": ["rice"],
                            "budget_id": "budget-0-30",
                            "dining_mode_ids": ["delivery"],
                            "created_at": "2026-03-29T12:00:00Z",
                        },
                        "matched_taste_tag_ids": ["rice"],
                        "applied_budget_id": "budget-0-30",
                        "applied_dining_mode_ids": ["delivery"],
                        "created_at": (now - timedelta(hours=8)).isoformat(),
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        os.environ["HISTORY_STORE_PATH"] = str(history_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "taste_tag_ids": ["rice"],
                "budget_id": "budget-0-30",
                "dining_mode_ids": ["delivery"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        os.environ.pop("HISTORY_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "楼下粉面"


def test_recommendation_excludes_current_candidate(
    monkeypatch, tmp_path: Path
) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "阿姨盖饭",
                        "note": "工作日晚餐常吃",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    },
                    {
                        "id": "candidate-2",
                        "name": "楼下粉面",
                        "note": "备选项",
                        "taste_tag_ids": ["rice"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:10:00Z",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_highest_weight(options, weights, k):
        max_index = max(range(len(weights)), key=lambda index: weights[index])
        return [options[max_index]]

    monkeypatch.setattr(decision_service._random, "choices", choose_highest_weight)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "taste_tag_ids": ["rice"],
                "budget_id": "budget-0-30",
                "dining_mode_ids": ["delivery"],
                "exclude_candidate_ids": ["candidate-1"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "楼下粉面"
    expected_rule_note = "已临时排除本轮看过的 1 个候选项，优先改抽其他店铺。"
    assert expected_rule_note in payload["rule_notes"]


def test_recommendation_mixes_candidates_with_uncovered_cuisines(
    monkeypatch, tmp_path: Path
) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "aaa",
                        "note": "已经补过店铺",
                        "cuisine_ids": ["cuisine-burger"],
                        "taste_tag_ids": ["hot"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-0-30",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    def choose_last_option(options, weights, k):
        return [options[-1]]

    monkeypatch.setattr(decision_service._random, "choices", choose_last_option)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post("/decisions/recommend", json={}, headers=headers)
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "empty"
    assert payload["title"] != "汉堡 / 西式快餐"
    assert payload["cuisine"] is not None


def test_recommendation_does_not_fallback_to_covered_cuisine(
    tmp_path: Path,
) -> None:
    candidate_store_path = tmp_path / "candidates.json"
    cuisine_store_path = tmp_path / "cuisines.json"
    candidate_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "candidate-1",
                        "name": "自定义麻辣拌店",
                        "note": "已经覆盖这个方向",
                        "cuisine_ids": ["custom-cuisine-1"],
                        "taste_tag_ids": ["spicy"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-30-60",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    cuisine_store_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "custom-cuisine-1",
                        "title": "麻辣拌",
                        "description": "午饭想吃点辣的时候。",
                        "taste_tag_ids": ["spicy"],
                        "scene_tag_ids": ["near-office"],
                        "budget_id": "budget-30-60",
                        "dining_mode_ids": ["delivery"],
                        "created_at": "2026-03-29T12:00:00Z",
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        os.environ["CUISINE_STORE_PATH"] = str(cuisine_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={
                "cuisine_ids": ["custom-cuisine-1"],
                "exclude_candidate_ids": ["candidate-1"],
            },
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        os.environ.pop("CUISINE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "empty"
    assert payload["title"] == "当前条件下还没有合适候选项"


def test_recommendation_excludes_current_cuisine_direction(
    monkeypatch, tmp_path: Path
) -> None:
    candidate_store_path = tmp_path / "candidates.json"

    def choose_last_option(options, weights, k):
        return [options[-1]]

    monkeypatch.setattr(decision_service._random, "choices", choose_last_option)

    try:
        os.environ["CANDIDATE_STORE_PATH"] = str(candidate_store_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client)
        response = client.post(
            "/decisions/recommend",
            json={"exclude_cuisine_ids": ["cuisine-rice-bowl"]},
            headers=headers,
        )
    finally:
        os.environ.pop("CANDIDATE_STORE_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "empty"
    assert payload["cuisine"] is not None
    assert payload["cuisine"]["id"] != "cuisine-rice-bowl"
    assert "已临时排除本轮看过的 1 个方向，优先改抽其他品类。" in payload["rule_notes"]
