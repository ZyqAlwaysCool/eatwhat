"""Schemas for feedback history."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.api.schemas.candidate import CandidateItem
from app.api.schemas.decision import DecisionCuisine


class FeedbackCreateRequest(BaseModel):
    action: Literal["accepted", "skipped", "disliked", "ate_recently", "too_expensive"]
    candidate: CandidateItem | None = None
    cuisine: DecisionCuisine | None = None
    title: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=240)
    applied_cuisine_ids: list[str] = Field(default_factory=list)
    matched_taste_tag_ids: list[str] = Field(default_factory=list)
    applied_scene_tag_ids: list[str] = Field(default_factory=list)
    applied_budget_id: str | None = None
    applied_dining_mode_ids: list[str] = Field(default_factory=list)


class HistoryItem(BaseModel):
    id: str
    action: Literal["accepted", "skipped", "disliked", "ate_recently", "too_expensive"]
    title: str
    description: str
    candidate: CandidateItem | None = None
    cuisine: DecisionCuisine | None = None
    applied_cuisine_ids: list[str] = Field(default_factory=list)
    matched_taste_tag_ids: list[str] = Field(default_factory=list)
    applied_scene_tag_ids: list[str] = Field(default_factory=list)
    applied_budget_id: str | None = None
    applied_dining_mode_ids: list[str] = Field(default_factory=list)
    created_at: datetime


class FeedbackCreateResponse(BaseModel):
    item: HistoryItem


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    total: int
