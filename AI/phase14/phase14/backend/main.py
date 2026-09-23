from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, ensure_db_directory
from backend.app.api.v1.router import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database directory exists and run database migrations
    ensure_db_directory(settings.database_url)
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
cors_origin_list = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip() and origin.strip() != "*"
] if settings.cors_origins else [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
for local_origin in ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]:
    if local_origin not in cors_origin_list:
        cors_origin_list.append(local_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health():
    try:
        from backend.app.api.v1.router import speech_adapter
        model_ready = speech_adapter is not None
        engine_name = getattr(speech_adapter, "engine_name", "faster-whisper")
        speech_model = getattr(speech_adapter, "model_name", "saaras:v3")
    except Exception:
        model_ready = False
        engine_name = "unknown"
        speech_model = "unknown"

    return {
        "status": "ok",
        "ready": model_ready,
        "service": "karigarSaathi-phase14",
        "model_ready": model_ready,
        "speech_engine": engine_name,
        "speech_model": speech_model,
        "supported_languages": ["en", "hi", "or", "bn", "te"],
    }