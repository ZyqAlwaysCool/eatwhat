"""API route registration."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.candidates import router as candidates_router
from app.api.routes.cuisines import router as cuisines_router
from app.api.routes.decisions import router as decisions_router
from app.api.routes.health import router as health_router
from app.api.routes.history import router as history_router


def create_router() -> APIRouter:
    router = APIRouter()
    router.include_router(health_router)
    router.include_router(auth_router)
    router.include_router(candidates_router)
    router.include_router(cuisines_router)
    router.include_router(decisions_router)
    router.include_router(history_router)
    return router
