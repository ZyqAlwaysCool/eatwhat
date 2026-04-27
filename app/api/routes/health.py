"""Health endpoints for local development and delivery checks."""

from fastapi import APIRouter

from app.api.schemas.health import HealthResponse
from app.api.services.health import build_health_response

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Health Check")
async def health() -> HealthResponse:
    return build_health_response()
