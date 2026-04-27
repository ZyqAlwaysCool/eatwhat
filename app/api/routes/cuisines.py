"""Custom cuisine pool endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_current_user
from app.api.schemas.cuisine import (
    CuisineCreateRequest,
    CuisineCreateResponse,
    CuisineListResponse,
)
from app.api.services.auth import CurrentUser
from app.api.services.cuisine_pool import create_cuisine, list_cuisines

router = APIRouter(prefix="/cuisines", tags=["cuisines"])
CurrentUserDep = Annotated[CurrentUser, Depends(require_current_user)]


@router.get("", response_model=CuisineListResponse, summary="List Cuisines")
async def get_cuisines(
    current_user: CurrentUserDep,
) -> CuisineListResponse:
    return list_cuisines(current_user)


@router.post(
    "",
    response_model=CuisineCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Cuisine",
)
async def post_cuisine(
    payload: CuisineCreateRequest,
    current_user: CurrentUserDep,
) -> CuisineCreateResponse:
    return create_cuisine(payload, current_user)
