"""Schemas for the private candidate pool."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CandidateItem(BaseModel):
    id: str
    name: str
    note: str | None = None
    cuisine_ids: list[str] = Field(default_factory=list)
    taste_tag_ids: list[str] = Field(default_factory=list)
    scene_tag_ids: list[str] = Field(default_factory=list)
    budget_id: str | None = None
    dining_mode_ids: list[str] = Field(default_factory=list)
    created_at: datetime


class CandidateListResponse(BaseModel):
    items: list[CandidateItem]
    total: int


class CandidateCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    note: str | None = Field(default=None, max_length=120)
    cuisine_ids: list[str] = Field(default_factory=list)
    taste_tag_ids: list[str] = Field(default_factory=list)
    scene_tag_ids: list[str] = Field(default_factory=list)
    budget_id: str | None = None
    dining_mode_ids: list[str] = Field(default_factory=list)


class CandidateCreateResponse(BaseModel):
    item: CandidateItem
