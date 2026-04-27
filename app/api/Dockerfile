FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/workspace \
    UV_LINK_MODE=copy

WORKDIR /workspace

RUN pip install --no-cache-dir uv

COPY app/api/pyproject.toml app/api/uv.lock ./app/api/
RUN uv sync --project app/api --frozen --no-dev

COPY app ./app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

CMD ["uv", "run", "--project", "app/api", "uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
