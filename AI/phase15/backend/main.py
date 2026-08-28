"""FastAPI Main Application Entry Point for Phase 15 Explainable Fair Price Assistant."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .app.api.v1.router import router as pricing_router
from .app.config import settings
from .app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle: initialize database tables on startup."""
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Explainable, rule-based, deterministic Fair Pricing Engine for Indian Artisans.",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System Health"])
async def health_check() -> dict:
    """Return health status, service identity, and supported capabilities."""
    return {
        "status": "ok",
        "service": "karigarSaathi-phase15",
        "service_name": "Explainable Fair-Price Assistant",
        "port": settings.app_port,
        "formula_version": settings.formula_version,
        "currency": "INR",
        "supported_locales": ["en", "hi", "or", "bn", "te"],
        "pricing_rules_ready": True,
    }


# Mount API V1 router
app.include_router(pricing_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.app_host, port=settings.app_port, reload=True)
