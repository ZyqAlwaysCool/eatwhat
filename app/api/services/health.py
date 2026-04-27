"""System services that keep infrastructure concerns out of routes."""

from app.api.schemas.health import HealthResponse


def build_health_response() -> HealthResponse:
    # 中文注释：这里保留一个稳定的健康检查响应，方便脚本和容器探针复用。
    return HealthResponse(status="ok", service="meal-decision-api")
