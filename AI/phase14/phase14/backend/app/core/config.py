from __future__ import annotations

import os
from typing import Optional
from pathlib import Path
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="KAIGAR_",
        env_file=(".env", ".env.example"),
        extra="ignore",
    )

    # Speech Provider (sarvam / faster-whisper)
    speech_engine: str = Field(default="faster-whisper", alias="SPEECH_ENGINE")
    sarvam_api_key: Optional[SecretStr] = Field(default=None, alias="SARVAM_API_KEY")
    sarvam_model: str = Field(default="saaras:v3", alias="SARVAM_MODEL")

    # Application
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="127.0.0.1", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    vite_api_base_url: str = Field(default="/api/v1", alias="VITE_API_BASE_URL")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Database
    database_url: str = Field(default="sqlite+aiosqlite:///./data/db.sqlite", alias="DATABASE_URL")

    # JWT - optional in development
    jwt_secret: SecretStr = Field(default="dev-secret-change-in-production", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expiry_minutes: int = Field(default=1440, alias="JWT_EXPIRY_MINUTES")

    # Consent
    consent_policy_version: str = Field(default="v1", alias="CONSENT_POLICY_VERSION")

    # Recording retention
    recording_retention_mode: str = Field(default="configurable", alias="RECORDING_RETENTION_MODE")
    recording_retention_days: int = Field(default=30, alias="RECORDING_RETENTION_DAYS")
    transcript_retention_days: int = Field(default=90, alias="TRANSCRIPT_RETENTION_DAYS")

    # Whisper
    whisper_model: str = Field(default="medium", alias="WHISPER_MODEL")
    whisper_device: str = Field(default="cpu", alias="WHISPER_DEVICE")
    whisper_compute_type: str = Field(default="int8", alias="WHISPER_COMPUTE_TYPE")
    low_confidence_threshold: float = Field(default=0.5, alias="LOW_CONFIDENCE_THRESHOLD")
    beam_size: int = Field(default=5, alias="BEAM_SIZE")

    # LLM - optional in development
    llm_base_url: str = Field(default="http://localhost:11434/v1", alias="LLM_BASE_URL")
    llm_api_key: SecretStr = Field(default="dev-key", alias="LLM_API_KEY")
    llm_model: str = Field(default="nemotron", alias="LLM_MODEL")
    llm_timeout_seconds: int = Field(default=60, alias="LLM_TIMEOUT_SECONDS")

    # CORS
    cors_origins: str = Field(default="http://localhost:5173,http://127.0.0.1:5173", alias="CORS_ORIGINS")

    # Audio
    max_audio_size_mb: int = Field(default=50, alias="MAX_AUDIO_SIZE_MB")
    max_audio_duration_seconds: int = Field(default=300, alias="MAX_AUDIO_DURATION_SECONDS")
    allowed_audio_formats: str = Field(default="wav,mp3,m4a,webm,ogg", alias="ALLOWED_AUDIO_FORMATS")

    # Feature flags
    enable_processing: bool = Field(default=True, alias="ENABLE_PROCESSING")

    # Private upload directory
    private_upload_dir: str = Field(default="./private/uploads", alias="PRIVATE_UPLOAD_DIR")


settings = Settings()  # type: ignore[assignment]