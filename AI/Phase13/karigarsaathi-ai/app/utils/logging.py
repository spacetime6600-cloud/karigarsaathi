"""Structured logging utilities for the AI Image Studio service."""

from __future__ import annotations

import logging
import sys
from typing import Any, Dict

import structlog

from app.config import get_settings


def setup_logging() -> None:
    """Set up structured logging for the application."""
    # Configure structlog
    processors = [
    structlog.processors.TimeStamper(fmt="iso"),
    structlog.processors.JSONRenderer()
]

    # Basic console handler for development
    logging.basicConfig(
        stream=sys.stdout,
        level=getattr(logging, "INFO", logging.INFO),
        format="%(message)s",
    )

    # Configure structlog processor chain
    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_call=True,
    )


def get_logger(name: str = __name__) -> Any:
    """Get a structured logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Structured logger instance
    """
    return structlog.get_logger(name)


def log_image_processing(
    logger: Any,
    artisan_id: str,
    product_id: str,
    request_id: str,
    operation: str,
    status: str,
    duration_ms: int,
    warnings: list[str] | None = None,
) -> None:
    """Log image processing event with consistent structure.

    Args:
        logger: Structured logger instance
        artisan_id: Artisan identifier
        product_id: Product identifier
        request_id: Request ID (idempotency key)
        operation: Operation performed
        status: Job state result
        duration_ms: Processing duration in milliseconds
        warnings: List of warning strings
    """
    log_data: Dict[str, Any] = {
        "event": "image_processing",
        "artisan_id": artisan_id,
        "product_id": product_id,
        "request_id": request_id,
        "operation": operation,
        "status": status,
        "duration_ms": duration_ms,
    }

    if warnings:
        log_data["warnings"] = warnings

    logger.info(**log_data)


def log_security_event(
    logger: Any,
    event_type: str,
    detail: str,
    artisan_id: str | None = None,
    request_id: str | None = None,
) -> None:
    """Log security-related events.

    Args:
        logger: Structured logger instance
        event_type: Type of security event
        detail: Detailed description
        artisan_id: Artisan identifier (if applicable)
        request_id: Request ID (if applicable)
    """
    log_data: Dict[str, any] = {
        "event": "security",
        "event_type": event_type,
        "detail": detail,
    }

    if artisan_id:
        log_data["artisan_id"] = artisan_id
    if request_id:
        log_data["request_id"] = request_id

    logger.warning(**log_data)


def log_validation_event(
    logger: Any,
    artifact_type: str,
    passed: bool,
    details: Dict[str, Any],
    artisan_id: str | None = None,
    request_id: str | None = None,
) -> None:
    """Log image validation events.

    Args:
        logger: Structured logger instance
        artifact_type: Type of validation (size, type, dimensions, etc.)
        passed: Whether validation passed
        details: Validation detail dictionary
        artisan_id: Artisan identifier (if applicable)
        request_id: Request ID (if applicable)
    """
    log_data: Dict[str, any] = {
        "event": "validation",
        "artifact_type": artifact_type,
        "passed": passed,
        "details": details,
    }

    if artisan_id:
        log_data["artisan_id"] = artisan_id
    if request_id:
        log_data["request_id"] = request_id

    if passed:
        logger.info(**log_data)
    else:
        logger.warning(**log_data)