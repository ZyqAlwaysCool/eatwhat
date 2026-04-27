"""Schemas for custom cuisine candidates."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CuisineItem(BaseModel):
    id: str
    title: str
    description: str
    taste_tag_ids: list[str] = Field(default_factory=list)
    scene_tag_ids: list[str] = Field(default_factory=list)
    budget_id: str | None = None
    dining_mode_ids: list[str] = Field(default_factory=list)
    created_at: datetime


class CuisineListResponse(BaseModel):
    items: list[CuisineItem]
    total: int


class CuisineCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=40)
    description: str = Field(min_length=1, max_length=120)
    taste_tag_ids: list[str] = Field(default_factory=list)
    scene_tag_ids: list[str] = Field(default_factory=list)
    budget_id: str | None = None
    dining_mode_ids: list[str] = Field(default_factory=list)


class CuisineCreateResponse(BaseModel):
    item: CuisineItem
