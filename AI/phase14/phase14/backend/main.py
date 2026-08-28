from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.v1.router import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run database migrations
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="KarigarSaathi AI Phase 14",
    description="Voice and Multilingual Auto-Catalogue",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for browser client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "service": "karigarSaathi-phase14",
        "model_ready": True,
        "supported_languages": ["en", "hi", "or", "bn"],
    }