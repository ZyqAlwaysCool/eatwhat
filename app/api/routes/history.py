"""History endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_current_user
from app.api.schemas.history import (
    FeedbackCreateRequest,
    FeedbackCreateResponse,
    HistoryListResponse,
)
from app.api.services.auth import CurrentUser
from app.api.services.history import list_history, record_feedback

router = APIRouter(tags=["history"])
CurrentUserDep = Annotated[CurrentUser, Depends(require_current_user)]


@router.get("/history", response_model=HistoryListResponse, summary="List History")
async def get_history(
    current_user: CurrentUserDep,
) -> HistoryListResponse:
    return list_history(current_user)


@router.post(
    "/decisions/feedback",
    response_model=FeedbackCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Decision Feedback",
)
async def post_feedback(
    payload: FeedbackCreateRequest,
    current_user: CurrentUserDep,
) -> FeedbackCreateResponse:
    return record_feedback(payload, current_user)
