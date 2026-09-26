"""Main entry point for the AI Image Studio microservice."""

from __future__ import annotations

import os
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import router
from app.api.media_routes import router as media_router

# Redirect storage directories to /tmp in serverless environment (Vercel)
if os.getenv("VERCEL"):
    os.environ.setdefault("ORIGINALS_DIR", "/tmp/storage/originals")
    os.environ.setdefault("ENHANCED_DIR", "/tmp/storage/enhanced")
    os.environ.setdefault("PREVIEWS_DIR", "/tmp/storage/previews")
    os.environ.setdefault("JOBS_DIR", "/tmp/storage/jobs")

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

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context manager for startup diagnostics."""
    port = os.getenv("PORT", str(settings.port))
    env = os.getenv("APP_ENV", settings.app_env)
    provider = os.getenv("MEDIA_STORAGE_PROVIDER", settings.media_storage_provider)
    model_name = os.getenv("REMBG_MODEL", "u2netp")
    logger.info(
        "AI Image Studio started [env=%s, port=%s, storage_provider=%s, rembg_model=%s, model_loading=lazy]",
        env,
        port,
        provider,
        model_name,
    )
    yield
    logger.info("AI Image Studio shutting down")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
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

# Add CORS middleware with explicit development and production origins
cors_origin_list = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
] if settings.cors_origins else []

for default_origin in [
    "https://karigarsaathi.vercel.app",
    "http://localhost:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000",
]:
    if default_origin not in cors_origin_list:
        cors_origin_list.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VercelPathFixMiddleware:
    """ASGI middleware to restore the original request path on Vercel deployments.

    When requests are rewritten in vercel.json (e.g. to /api/index.py),
    the ASGI scope['path'] arrives as '/api/index.py' rather than the client's
    intended route (e.g. '/health', '/openapi.json', '/v1/...').

    This middleware restores the original path from:
    1. x-matched-path, x-forwarded-uri, x-invoke-path, or x-original-uri headers
    2. __path query parameter (passed by vercel.json rewrites)
    3. Trimming /api prefix for /v1/... endpoints
    4. Defaulting literal entrypoint hits without a subpath to '/' (root)
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path in ("/api/index.py", "/api/index", "/api", "/api/index.py/"):
                target_path = None
                headers = dict(scope.get("headers", []))
                for h in (b"x-matched-path", b"x-forwarded-uri", b"x-invoke-path", b"x-original-uri"):
                    val = headers.get(h)
                    if val:
                        decoded = val.decode("utf-8").split("?")[0]
                        if decoded and decoded not in ("/api/index.py", "/api/index"):
                            target_path = decoded
                            break

                if not target_path:
                    query_string = scope.get("query_string", b"").decode("utf-8")
                    if "__path=" in query_string:
                        import urllib.parse
                        params = urllib.parse.parse_qs(query_string, keep_blank_values=True)
                        if "__path" in params and params["__path"]:
                            target_path = params["__path"][0]
                            new_params = {k: v for k, v in params.items() if k != "__path"}
                            new_qs = urllib.parse.urlencode(new_params, doseq=True)
                            scope["query_string"] = new_qs.encode("utf-8")

                if not target_path:
                    target_path = "/"

                scope["path"] = target_path
                scope["raw_path"] = target_path.encode("utf-8")
            elif path.startswith("/api/v1/"):
                trimmed = path[4:]
                scope["path"] = trimmed
                scope["raw_path"] = trimmed.encode("utf-8")

        await self.app(scope, receive, send)


app.add_middleware(VercelPathFixMiddleware)

# Include API routes
app.include_router(router)
app.include_router(media_router)


@app.get("/", include_in_schema=False, tags=["root"])
async def root():
    """Root endpoint - basic service info."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "endpoint": "/v1/enhancements (POST) or /health (GET)",
    }


@app.get("/api", include_in_schema=False, tags=["root"])
async def api_root():
    """Root endpoint alias under /api prefix."""
    return await root()


@app.get("/health", include_in_schema=False, response_model=None)
async def health():
    """Health check endpoint.

    Returns service status, service version and model readiness.
    Never exposes secrets or internal paths.
    """
    from pydantic import BaseModel
    from app.api.routes import background_removal_adapter

    class _HealthModel(BaseModel):
        status: str
        service: str
        version: str
        model_ready: bool

    model_ready = getattr(background_removal_adapter, "is_model_ready", False)

    return _HealthModel(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version,
        model_ready=model_ready,
    )


@app.get("/api/health", include_in_schema=False, response_model=None)
async def api_health():
    """Health check endpoint alias under /api prefix."""
    return await health()


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