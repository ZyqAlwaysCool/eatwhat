"""Decision endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies.auth import require_current_user
from app.api.schemas.decision import DecisionRequest, DecisionResponse
from app.api.services.auth import CurrentUser
from app.api.services.decision import recommend_decision

router = APIRouter(prefix="/decisions", tags=["decisions"])
CurrentUserDep = Annotated[CurrentUser, Depends(require_current_user)]


@router.post(
    "/recommend",
    response_model=DecisionResponse,
    summary="Recommend Decision",
)
async def post_recommendation(
    payload: DecisionRequest,
    current_user: CurrentUserDep,
) -> DecisionResponse:
    return recommend_decision(payload, current_user)
