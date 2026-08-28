from __future__ import annotations

from typing import Optional, Dict, Any

from fastapi import HTTPException
from http import HTTPStatus


class CatalogueGenerationError(HTTPException):
    """Raised when catalogue generation fails."""

    def __init__(
        self,
        message: str,
        error_code: str,
        retryable: bool = False,
    ):
        super().__init__(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=message,
        )
        self.error_code = error_code
        self.retryable = retryable


class ModelConfigurationError(CatalogueGenerationError):
    """Raised when LLM configuration is missing or invalid."""

    def __init__(self, message: str = "LLM configuration error"):
        super().__init__(
            message=message,
            error_code="MODEL_CONFIGURATION_ERROR",
            retryable=False,
        )


class ModelTimeoutError(CatalogueGenerationError):
    """Raised when the model request times out."""

    def __init__(self, message: str = "Model request timed out"):
        super().__init__(
            message=message,
            error_code="MODEL_TIMEOUT_ERROR",
            retryable=True,
        )


class ModelRateLimitError(CatalogueGenerationError):
    """Raised when the model rate limits the client."""

    def __init__(self, message: str = "Model rate limit exceeded"):
        super().__init__(
            message=message,
            error_code="MODEL_RATE_LIMIT_ERROR",
            retryable=True,
        )


class ModelServerError(CatalogueGenerationError):
    """Raised when the model server returns an error."""

    def __init__(self, message: str = "Model server error"):
        super().__init__(
            message=message,
            error_code="MODEL_SERVER_ERROR",
            retryable=True,
        )


class MalformedResponseError(CatalogueGenerationError):
    """Raised when the model response is malformed."""

    def __init__(self, message: str = "Model response is malformed"):
        super().__init__(
            message=message,
            error_code="MALFORMED_RESPONSE_ERROR",
            retryable=False,
        )


class SchemaValidationError(CatalogueGenerationError):
    """Raised when the model response doesn't match the expected schema."""

    def __init__(self, message: str = "Schema validation failed"):
        super().__init__(
            message=message,
            error_code="SCHEMA_VALIDATION_ERROR",
            retryable=False,
        )


class UnexpectedFieldError(CatalogueGenerationError):
    """Raised when the model response contains fields not in the schema."""

    def __init__(self, message: str = "Unexpected fields in model response"):
        super().__init__(
            message=message,
            error_code="UNEXPECTED_FIELD_ERROR",
            retryable=False,
        )


class ModelGenerationError(CatalogueGenerationError):
    """Raised for unexpected model generation errors."""

    def __init__(self, message: str = "Model generation error"):
        super().__init__(
            message=message,
            error_code="MODEL_GENERATION_ERROR",
            retryable=True,
        )