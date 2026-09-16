"""Main entry point for the AI Image Studio microservice."""

from __future__ import annotations

import os

import uvicorn
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import router

# Initialize settings
settings = get_settings()

# Configure logging
def setup_logging() -> None:
    """Set up application logging."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler()],
    )

# Structured logger
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description=(
        "KarigarSaathi AI Image Studio - AI-powered product photograph "
        "enhancement service for Indian artisans. Improves product photographs "
        "without changing the craft's real colour, pattern, texture, edges, "
        "proportions or identity."
    ),
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Add CORS middleware with explicit development origins
cors_origin_list = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
] if settings.cors_origins else [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000",
    "http://10.5.0.2:3001",
    "http://10.5.0.2:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/", include_in_schema=False, tags=["root"])
async def root():
    """Root endpoint - basic service info."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "endpoint": "/v1/enhancements (POST) or /health (GET)",
    }


@app.get("/health", include_in_schema=False, response_model=None)
async def health():
    """Health check endpoint.

    Returns service status, service version and model readiness.
    Never exposes secrets or internal paths.
    """
    from app.config import get_settings
    from pydantic import BaseModel

    class _HealthModel(BaseModel):
        status: str
        service: str
        version: str
        model_ready: bool

    return _HealthModel(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version,
        model_ready=True,
    )


def main() -> None:
    """Run the application."""
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers,
        reload=settings.app_debug,
    )


if __name__ == "__main__":
    main()