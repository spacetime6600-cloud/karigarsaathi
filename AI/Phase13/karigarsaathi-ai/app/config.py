"""Configuration for AI Image Studio using Pydantic Settings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="KarigarSaathi AI Image Studio", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_debug: bool = Field(default=True, alias="APP_DEBUG")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    workers: int = Field(default=1, alias="WORKERS")

    # Directories
    originals_dir: str = Field(default="storage/originals", alias="ORIGINALS_DIR")
    enhanced_dir: str = Field(default="storage/enhanced", alias="ENHANCED_DIR")
    previews_dir: str = Field(default="storage/previews", alias="PREVIEWS_DIR")

    # Image validation
    min_dimension: int = Field(default=256, alias="MIN_DIMENSION")
    max_dimension: int = Field(default=6000, alias="MAX_DIMENSION")
    max_upload_size: int = Field(default=10485760, alias="MAX_UPLOAD_SIZE")  # 10 MB
    allowed_mime_types: str = Field(
        default="image/jpeg,image/png,image/webp", alias="ALLOWED_MIME_TYPES"
    )

    # Quota defaults
    default_jobs_per_artisan_per_day: int = Field(
        default=20, alias="DEFAULT_JOBS_PER_ARTISAN_PER_DAY"
    )
    max_processing_time_seconds: int = Field(
        default=60, alias="MAX_PROCESSING_TIME_SECONDS"
    )

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:8080", alias="CORS_ORIGINS"
    )

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Security
    development_bearer_token: str = Field(
        default="your-dev-token-here", alias="DEVELOPMENT_BEARER_TOKEN"
    )


def get_settings() -> Settings:
    """Get configured settings instance."""
    return Settings()  # type: ignore[return-value]