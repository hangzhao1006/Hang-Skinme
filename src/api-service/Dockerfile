# syntax=docker/dockerfile:1
FROM python:3.12-slim-bookworm

ARG DEBIAN_PACKAGES="curl"

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy
ENV UV_PROJECT_ENVIRONMENT=/.venv
ENV PATH="/.venv/bin:$PATH"

RUN set -ex; \
    apt-get update && \
    apt-get install -y --no-install-recommends $DEBIAN_PACKAGES && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir --upgrade pip && \
    pip install uv && \
    useradd -ms /bin/bash app -d /home/app -u 1000 && \
    mkdir -p /app /.venv && chown -R app:app /app /.venv

USER app
WORKDIR /app

# Copy dependency files first for better layer caching
COPY --chown=app:app pyproject.toml uv.lock* ./

# Install dependencies in a separate layer for better caching
# Install with test extras for CI/CD
RUN uv sync --all-extras

# Copy agent module directly to /app
COPY --chown=app:app agent/ ./agent/

# Copy API service files
COPY --chown=app:app api-service/main.py api-service/runner.py ./

# Set PYTHONPATH to include /app
ENV PYTHONPATH=/app

# Default command - starts FastAPI service
CMD ["python", "main.py"]
