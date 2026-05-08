"""FastAPI application factory for the meal decision service."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.bootstrap import prepare_persistence, validate_runtime_settings
from app.api.core.settings import get_settings
from app.api.routes import create_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    validate_runtime_settings(settings)
    prepare_persistence(settings)
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )
    app.include_router(create_router())
    return app


app = create_app()
