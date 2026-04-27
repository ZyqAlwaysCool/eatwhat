"""Recommendation service for the meal decision flow."""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from app.api.schemas.candidate import CandidateItem
from app.api.schemas.decision import DecisionCuisine, DecisionRequest, DecisionResponse
from app.api.services.auth import CurrentUser
from app.api.services.candidate_pool import list_candidates
from app.api.services.cuisine_catalog import CuisineCandidate, list_cuisine_candidates
from app.api.services.cuisine_pool import list_cuisines
from app.api.services.history import list_history

_random = random.Random()
RECENT_ACCEPTED_WINDOW = timedelta(hours=72)
RECENT_SKIPPED_WINDOW = timedelta(hours=24)
RECENT_ATE_WINDOW = timedelta(days=7)
RECENT_DISLIKED_WINDOW = timedelta(days=14)
RECENT_TOO_EXPENSIVE_WINDOW = timedelta(days=14)
ACCEPTED_FEEDBACK_BOOST = 0.35
SKIPPED_FEEDBACK_FACTOR = 0.45
DISLIKED_FEEDBACK_FACTOR = 0.2
TOO_EXPENSIVE_FACTOR = 0.35
ANY_SCENE_TAG_ID = "no-limit"
ANY_DINING_MODE_ID = "either"


@dataclass
class CandidateFeedbackStats:
    last_accepted_at: datetime | None = None
    last_skipped_at: datetime | None = None
    last_disliked_at: datetime | None = None
    last_too_expensive_at: datetime | None = None
    last_ate_recently_at: datetime | None = None
    accepted_count: int = 0
    skipped_count: int = 0
    disliked_count: int = 0
    too_expensive_count: int = 0
    ate_recently_count: int = 0


@dataclass
class EligibleCuisineChoice:
    cuisine: CuisineCandidate
    matched_taste_tag_ids: list[str]
    weight: float


def recommend_decision(
    payload: DecisionRequest, current_user: CurrentUser
) -> DecisionResponse:
    candidates = list_candidates(current_user).items
    eligible_candidate_items: list[
        tuple[CandidateItem, list[str], list[str], float, list[str]]
    ] = []
    eligible_cuisine_items: list[EligibleCuisineChoice] = []
    feedback_stats = _build_feedback_stats(current_user)
    now = datetime.now(UTC)
    excluded_candidate_ids = set(payload.exclude_candidate_ids)
    excluded_cuisine_ids = set(payload.exclude_cuisine_ids)
    requested_cuisine_ids = set(payload.cuisine_ids)
    requested_scene_tag_ids = set(payload.scene_tag_ids) - {ANY_SCENE_TAG_ID}
    requested_dining_mode_ids = set(payload.dining_mode_ids) - {ANY_DINING_MODE_ID}
    covered_cuisine_ids = _build_covered_cuisine_id_set(candidates)
    recent_accepted_filtered_count = 0
    recent_ate_filtered_count = 0
    too_expensive_adjusted_count = 0

    for candidate in candidates:
        if candidate.id in excluded_candidate_ids:
            continue

        candidate_stats = feedback_stats.get(candidate.id, CandidateFeedbackStats())

        if _was_recently_accepted(candidate_stats, now):
            recent_accepted_filtered_count += 1
            continue

        if _was_marked_ate_recently(candidate_stats, now):
            recent_ate_filtered_count += 1
            continue

        if not _matches_requested_cuisines(
            candidate.cuisine_ids, requested_cuisine_ids
        ):
            continue

        if not _matches_budget(candidate.budget_id, payload.budget_id):
            continue

        if not _matches_scene_tags(candidate.scene_tag_ids, requested_scene_tag_ids):
            continue

        if not _matches_dining_modes(
            candidate.dining_mode_ids, requested_dining_mode_ids
        ):
            continue

        matched_taste_tag_ids = sorted(
            set(payload.taste_tag_ids).intersection(candidate.taste_tag_ids)
        )
        matched_cuisine_ids = sorted(
            requested_cuisine_ids.intersection(candidate.cuisine_ids)
        )
        if _was_marked_too_expensive(candidate_stats, now):
            too_expensive_adjusted_count += 1
        weight, rule_notes = _calculate_weight(
            candidate,
            payload,
            matched_cuisine_ids,
            matched_taste_tag_ids,
            candidate_stats,
            now,
        )
        eligible_candidate_items.append(
            (
                candidate,
                matched_cuisine_ids,
                matched_taste_tag_ids,
                weight,
                rule_notes,
            )
        )

    for cuisine in _list_all_cuisine_candidates(current_user):
        if cuisine.id in covered_cuisine_ids or cuisine.id in excluded_cuisine_ids:
            continue

        if requested_cuisine_ids and cuisine.id not in requested_cuisine_ids:
            continue

        if not _matches_budget(cuisine.budget_id, payload.budget_id):
            continue

        if not _matches_scene_tags(cuisine.scene_tag_ids, requested_scene_tag_ids):
            continue

        if not _matches_dining_modes(
            cuisine.dining_mode_ids, requested_dining_mode_ids
        ):
            continue

        matched_taste_tag_ids = sorted(
            set(payload.taste_tag_ids).intersection(cuisine.taste_tag_ids)
        )
        eligible_cuisine_items.append(
            EligibleCuisineChoice(
                cuisine=cuisine,
                matched_taste_tag_ids=matched_taste_tag_ids,
                weight=_calculate_cuisine_weight(
                    cuisine, payload, matched_taste_tag_ids
                ),
            )
        )

    if not eligible_candidate_items and not eligible_cuisine_items:
        rule_notes = _build_rule_notes(
            recent_accepted_filtered_count,
            recent_ate_filtered_count,
            len(excluded_candidate_ids),
            len(excluded_cuisine_ids),
            too_expensive_adjusted_count,
        )
        return DecisionResponse(
            mode="empty",
            title="当前条件下还没有合适候选项",
            description=(
                "可以先放宽筛选条件，或者去候选池补一个你熟悉的店名或昵称。"
                if not rule_notes
                else "候选池里有些项目因为最近刚吃过被过滤了，可以换个条件再试。"
            ),
            rule_notes=rule_notes,
            applied_cuisine_ids=sorted(requested_cuisine_ids),
            applied_scene_tag_ids=sorted(requested_scene_tag_ids),
            applied_budget_id=payload.budget_id,
            applied_dining_mode_ids=sorted(requested_dining_mode_ids),
        )

    all_choices: list[tuple[str, object, float]] = [
        ("candidate", item, item[3]) for item in eligible_candidate_items
    ] + [("cuisine", item, item.weight) for item in eligible_cuisine_items]
    chosen_kind, chosen_item, _ = _random.choices(
        all_choices, weights=[weight for _, _, weight in all_choices], k=1
    )[0]

    shared_rule_notes = _build_rule_notes(
        recent_accepted_filtered_count,
        recent_ate_filtered_count,
        len(excluded_candidate_ids),
        len(excluded_cuisine_ids),
        too_expensive_adjusted_count,
    )

    if chosen_kind == "candidate":
        (
            chosen_candidate,
            matched_cuisine_ids,
            matched_taste_tag_ids,
            _,
            candidate_rule_notes,
        ) = chosen_item
        rule_notes = list(candidate_rule_notes)
        rule_notes.extend(shared_rule_notes)

        return DecisionResponse(
            mode="candidate",
            title=chosen_candidate.name,
            description=_build_reason(
                chosen_candidate,
                payload,
                matched_cuisine_ids,
                matched_taste_tag_ids,
            ),
            candidate=chosen_candidate,
            rule_notes=rule_notes,
            matched_cuisine_ids=matched_cuisine_ids,
            matched_taste_tag_ids=matched_taste_tag_ids,
            applied_cuisine_ids=sorted(requested_cuisine_ids),
            applied_scene_tag_ids=sorted(requested_scene_tag_ids),
            applied_budget_id=payload.budget_id,
            applied_dining_mode_ids=sorted(requested_dining_mode_ids),
        )
    chosen_cuisine_choice = chosen_item
    return DecisionResponse(
        mode="empty",
        title=chosen_cuisine_choice.cuisine.title,
        description=chosen_cuisine_choice.cuisine.description,
        candidate=None,
        cuisine=DecisionCuisine(
            id=chosen_cuisine_choice.cuisine.id,
            title=chosen_cuisine_choice.cuisine.title,
        ),
        rule_notes=shared_rule_notes,
        matched_cuisine_ids=[chosen_cuisine_choice.cuisine.id],
        matched_taste_tag_ids=chosen_cuisine_choice.matched_taste_tag_ids,
        applied_cuisine_ids=sorted(requested_cuisine_ids),
        applied_scene_tag_ids=sorted(requested_scene_tag_ids),
        applied_budget_id=payload.budget_id,
        applied_dining_mode_ids=sorted(requested_dining_mode_ids),
    )


def _list_all_cuisine_candidates(current_user: CurrentUser) -> list[CuisineCandidate]:
    built_in_items = list_cuisine_candidates()
    custom_items = [
        CuisineCandidate(
            id=item.id,
            title=item.title,
            description=item.description,
            taste_tag_ids=item.taste_tag_ids,
            scene_tag_ids=item.scene_tag_ids,
            budget_id=item.budget_id,
            dining_mode_ids=item.dining_mode_ids,
        )
        for item in list_cuisines(current_user).items
    ]

    return [*custom_items, *built_in_items]


def _calculate_weight(
    candidate: CandidateItem,
    payload: DecisionRequest,
    matched_cuisine_ids: list[str],
    matched_taste_tag_ids: list[str],
    feedback_stats: CandidateFeedbackStats,
    now: datetime,
) -> tuple[float, list[str]]:
    # 中文注释：只要已经进入店铺层，默认就比“还没补店的方向提示”更靠前一些。
    weight = 1.4
    rule_notes: list[str] = []
    weight += 0.9 * len(matched_cuisine_ids)
    weight += 0.6 * len(matched_taste_tag_ids)

    if payload.budget_id and candidate.budget_id == payload.budget_id:
        weight += 0.3

    requested_scene_tag_ids = set(payload.scene_tag_ids) - {ANY_SCENE_TAG_ID}
    requested_dining_mode_ids = set(payload.dining_mode_ids) - {ANY_DINING_MODE_ID}

    if requested_scene_tag_ids and (
        ANY_SCENE_TAG_ID in candidate.scene_tag_ids
        or requested_scene_tag_ids.intersection(candidate.scene_tag_ids)
    ):
        weight += 0.3

    if requested_dining_mode_ids and (
        ANY_DINING_MODE_ID in candidate.dining_mode_ids
        or requested_dining_mode_ids.intersection(candidate.dining_mode_ids)
    ):
        weight += 0.3

    if candidate.note:
        # 中文注释：带备注的候选项通常是用户主动补充过上下文，先给一点轻微权重加成。
        weight += 0.2

    if (
        feedback_stats.accepted_count > 0
        and not _was_recently_accepted(feedback_stats, now)
    ):
        weight += ACCEPTED_FEEDBACK_BOOST
        rule_notes.append("参考了历史接受反馈，提高了熟悉项权重。")

    if _was_recently_skipped(feedback_stats, now):
        weight *= SKIPPED_FEEDBACK_FACTOR
        rule_notes.append("近期有过跳过反馈，已自动下调本次权重。")

    if _was_recently_disliked(feedback_stats, now):
        weight *= DISLIKED_FEEDBACK_FACTOR
        rule_notes.append("近期有过不喜欢反馈，已大幅下调本次权重。")

    if _was_marked_too_expensive(feedback_stats, now):
        weight *= TOO_EXPENSIVE_FACTOR
        rule_notes.append("近期有过太贵了反馈，已下调该候选项权重。")

    return weight, rule_notes


def _calculate_cuisine_weight(
    cuisine: CuisineCandidate,
    payload: DecisionRequest,
    matched_taste_tag_ids: list[str],
) -> float:
    weight = 1.0

    if payload.cuisine_ids and cuisine.id in payload.cuisine_ids:
        weight += 0.9

    weight += 0.6 * len(matched_taste_tag_ids)

    if payload.budget_id and cuisine.budget_id == payload.budget_id:
        weight += 0.3

    requested_scene_tag_ids = set(payload.scene_tag_ids) - {ANY_SCENE_TAG_ID}
    requested_dining_mode_ids = set(payload.dining_mode_ids) - {ANY_DINING_MODE_ID}

    if requested_scene_tag_ids and (
        ANY_SCENE_TAG_ID in cuisine.scene_tag_ids
        or requested_scene_tag_ids.intersection(cuisine.scene_tag_ids)
    ):
        weight += 0.3

    if requested_dining_mode_ids and (
        ANY_DINING_MODE_ID in cuisine.dining_mode_ids
        or requested_dining_mode_ids.intersection(cuisine.dining_mode_ids)
    ):
        weight += 0.3

    return weight


def _build_reason(
    candidate: CandidateItem,
    payload: DecisionRequest,
    matched_cuisine_ids: list[str],
    matched_taste_tag_ids: list[str],
) -> str:
    reasons: list[str] = []

    if matched_cuisine_ids:
        reasons.append("命中了当前品类偏好")

    if matched_taste_tag_ids:
        reasons.append("命中了当前口味偏好")

    if payload.budget_id and candidate.budget_id == payload.budget_id:
        reasons.append("预算范围匹配")

    requested_scene_tag_ids = set(payload.scene_tag_ids) - {ANY_SCENE_TAG_ID}
    requested_dining_mode_ids = set(payload.dining_mode_ids) - {ANY_DINING_MODE_ID}

    if requested_scene_tag_ids and (
        ANY_SCENE_TAG_ID in candidate.scene_tag_ids
        or requested_scene_tag_ids.intersection(candidate.scene_tag_ids)
    ):
        reasons.append("场景位置匹配")

    if requested_dining_mode_ids and (
        ANY_DINING_MODE_ID in candidate.dining_mode_ids
        or requested_dining_mode_ids.intersection(candidate.dining_mode_ids)
    ):
        reasons.append("用餐方式匹配")

    if candidate.note:
        reasons.append("候选项备注信息更完整")

    if not reasons:
        return "当前先按候选池进行轻量加权抽选，后续会继续叠加反馈回收与近期规则。"

    return "；".join(reasons) + "。"


def _build_feedback_stats(
    current_user: CurrentUser,
) -> dict[str, CandidateFeedbackStats]:
    stats: dict[str, CandidateFeedbackStats] = {}

    for item in list_history(current_user).items:
        if item.candidate is None:
            continue

        candidate_stats = stats.setdefault(item.candidate.id, CandidateFeedbackStats())

        if item.action == "accepted":
            candidate_stats.accepted_count += 1
            if (
                candidate_stats.last_accepted_at is None
                or item.created_at > candidate_stats.last_accepted_at
            ):
                candidate_stats.last_accepted_at = item.created_at
        elif item.action == "skipped":
            candidate_stats.skipped_count += 1
            if (
                candidate_stats.last_skipped_at is None
                or item.created_at > candidate_stats.last_skipped_at
            ):
                candidate_stats.last_skipped_at = item.created_at
        elif item.action == "disliked":
            candidate_stats.disliked_count += 1
            if (
                candidate_stats.last_disliked_at is None
                or item.created_at > candidate_stats.last_disliked_at
            ):
                candidate_stats.last_disliked_at = item.created_at
        elif item.action == "too_expensive":
            candidate_stats.too_expensive_count += 1
            if (
                candidate_stats.last_too_expensive_at is None
                or item.created_at > candidate_stats.last_too_expensive_at
            ):
                candidate_stats.last_too_expensive_at = item.created_at
        elif item.action == "ate_recently":
            candidate_stats.ate_recently_count += 1
            if (
                candidate_stats.last_ate_recently_at is None
                or item.created_at > candidate_stats.last_ate_recently_at
            ):
                candidate_stats.last_ate_recently_at = item.created_at

    return stats


def _build_covered_cuisine_id_set(candidates: list[CandidateItem]) -> set[str]:
    covered_cuisine_ids: set[str] = set()

    for candidate in candidates:
        covered_cuisine_ids.update(candidate.cuisine_ids)

    return covered_cuisine_ids


def _matches_requested_cuisines(
    candidate_cuisine_ids: list[str], requested_cuisine_ids: set[str]
) -> bool:
    if not requested_cuisine_ids:
        return True

    return bool(requested_cuisine_ids.intersection(candidate_cuisine_ids))


def _matches_budget(
    candidate_budget_id: str | None, requested_budget_id: str | None
) -> bool:
    if not requested_budget_id:
        return True

    return candidate_budget_id == requested_budget_id


def _matches_scene_tags(
    candidate_scene_tag_ids: list[str], requested_scene_tag_ids: set[str]
) -> bool:
    if not requested_scene_tag_ids:
        return True

    return ANY_SCENE_TAG_ID in candidate_scene_tag_ids or bool(
        requested_scene_tag_ids.intersection(candidate_scene_tag_ids)
    )


def _matches_dining_modes(
    candidate_dining_mode_ids: list[str], requested_dining_mode_ids: set[str]
) -> bool:
    if not requested_dining_mode_ids:
        return True

    return ANY_DINING_MODE_ID in candidate_dining_mode_ids or bool(
        requested_dining_mode_ids.intersection(candidate_dining_mode_ids)
    )


def _was_recently_accepted(
    feedback_stats: CandidateFeedbackStats, now: datetime
) -> bool:
    if feedback_stats.last_accepted_at is None:
        return False

    return now - feedback_stats.last_accepted_at < RECENT_ACCEPTED_WINDOW


def _was_recently_skipped(
    feedback_stats: CandidateFeedbackStats, now: datetime
) -> bool:
    if feedback_stats.last_skipped_at is None:
        return False

    return now - feedback_stats.last_skipped_at < RECENT_SKIPPED_WINDOW


def _was_recently_disliked(
    feedback_stats: CandidateFeedbackStats, now: datetime
) -> bool:
    if feedback_stats.last_disliked_at is None:
        return False

    return now - feedback_stats.last_disliked_at < RECENT_DISLIKED_WINDOW


def _was_marked_ate_recently(
    feedback_stats: CandidateFeedbackStats, now: datetime
) -> bool:
    if feedback_stats.last_ate_recently_at is None:
        return False

    return now - feedback_stats.last_ate_recently_at < RECENT_ATE_WINDOW


def _was_marked_too_expensive(
    feedback_stats: CandidateFeedbackStats, now: datetime
) -> bool:
    if feedback_stats.last_too_expensive_at is None:
        return False

    return now - feedback_stats.last_too_expensive_at < RECENT_TOO_EXPENSIVE_WINDOW


def _build_rule_notes(
    recent_accepted_filtered_count: int,
    recent_ate_filtered_count: int,
    excluded_candidate_count: int,
    excluded_cuisine_count: int,
    too_expensive_adjusted_count: int,
) -> list[str]:
    notes: list[str] = []

    if excluded_candidate_count > 0:
        notes.append(
            "已临时排除本轮看过的 "
            f"{excluded_candidate_count} 个候选项，优先改抽其他店铺。"
        )

    if excluded_cuisine_count > 0:
        notes.append(
            "已临时排除本轮看过的 "
            f"{excluded_cuisine_count} 个方向，优先改抽其他品类。"
        )

    if recent_accepted_filtered_count > 0:
        notes.append(
            "已过滤最近 "
            f"{RECENT_ACCEPTED_WINDOW.days} 天内已接受的 "
            f"{recent_accepted_filtered_count} 个候选项。"
        )

    if recent_ate_filtered_count > 0:
        notes.append(
            "已过滤最近 "
            f"{RECENT_ATE_WINDOW.days} 天内标记为最近吃过的 "
            f"{recent_ate_filtered_count} 个候选项。"
        )

    if too_expensive_adjusted_count > 0:
        notes.append(
            f"已根据太贵了反馈，下调 {too_expensive_adjusted_count} 个候选项权重。"
        )

    return notes
