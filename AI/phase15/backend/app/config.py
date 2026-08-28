"""Configuration settings for Phase 15 Explainable Fair Pricing microservice."""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "KarigarSaathi Fair Price Assistant (Phase 15)"
    app_version: str = "1.0.0"
    formula_version: str = "fair-price-rules-v1"
    app_port: int = 8002
    app_host: str = "0.0.0.0"
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./backend/data/pricing_feedback.db"
    jwt_secret: str = os.getenv("JWT_SECRET", "karigarsaathi_jwt_secret_dev_2026")
    jwt_algorithm: str = "HS256"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
