"""Response schemas for non-business system endpoints."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
