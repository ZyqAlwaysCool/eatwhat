"""Schemas for recommendation decisions."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.api.schemas.candidate import CandidateItem


class DecisionCuisine(BaseModel):
    id: str
    title: str


class DecisionRequest(BaseModel):
    cuisine_ids: list[str] = Field(default_factory=list)
    taste_tag_ids: list[str] = Field(default_factory=list)
    scene_tag_ids: list[str] = Field(default_factory=list)
    budget_id: str | None = None
    dining_mode_ids: list[str] = Field(default_factory=list)
    exclude_candidate_ids: list[str] = Field(default_factory=list)
    exclude_cuisine_ids: list[str] = Field(default_factory=list)


class DecisionResponse(BaseModel):
    mode: Literal["candidate", "empty"]
    title: str
    description: str
    candidate: CandidateItem | None = None
    cuisine: DecisionCuisine | None = None
    rule_notes: list[str] = Field(default_factory=list)
    matched_cuisine_ids: list[str] = Field(default_factory=list)
    matched_taste_tag_ids: list[str] = Field(default_factory=list)
    applied_cuisine_ids: list[str] = Field(default_factory=list)
    applied_scene_tag_ids: list[str] = Field(default_factory=list)
    applied_budget_id: str | None = None
    applied_dining_mode_ids: list[str] = Field(default_factory=list)
