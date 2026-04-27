"""Candidate pool endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_current_user
from app.api.schemas.candidate import (
    CandidateCreateRequest,
    CandidateCreateResponse,
    CandidateListResponse,
)
from app.api.services.auth import CurrentUser
from app.api.services.candidate_pool import create_candidate, list_candidates

router = APIRouter(prefix="/candidates", tags=["candidates"])
CurrentUserDep = Annotated[CurrentUser, Depends(require_current_user)]


@router.get("", response_model=CandidateListResponse, summary="List Candidates")
async def get_candidates(
    current_user: CurrentUserDep,
) -> CandidateListResponse:
    return list_candidates(current_user)


@router.post(
    "",
    response_model=CandidateCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Candidate",
)
async def post_candidate(
    payload: CandidateCreateRequest,
    current_user: CurrentUserDep,
) -> CandidateCreateResponse:
    return create_candidate(payload, current_user)
