"""Hashing utilities for image checksums and file identification."""

from __future__ import import annotations

import hashlib
from typing import Optional


def sha256_checksum(data: bytes) -> str:
    """Calculate SHA-256 hex digest of bytes data.

    Args:
        data: Raw bytes to hash

    Returns:
        Hex SHA-256 checksum string (64 characters)
    """
    return hashlib.sha256(data).hexdigest()


def file_checksum(filepath: str) -> Optional[str]:
    """Calculate SHA-256 checksum of a file.

    Args:
        filepath: Path to file

    Returns:
        Hex SHA-256 checksum or None if file not found
    """
    try:
        with open(filepath, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except FileNotFoundError:
        return None


def data_hex(data: bytes) -> str:
    """Return hex representation of bytes (for logging, not security).

    Args:
        data: Bytes to hexlify

    Returns:
        Hex string
    """
    return data.hex()


def constant_time_compare(a: bytes, b: bytes) -> bool:
    """Compare two byte strings in constant time to prevent timing attacks.

    Args:
        a: First byte string
        b: Second byte string

    Returns:
        True if strings are equal, False otherwise
    """
    import hmac
    return hmac.compare_digest(a, b)


# Pre-computed hash of allowed MIME types for quick comparison
ALLOWED_MIME_HASHES: dict[str, str] = {
    "image/jpeg": sha256_checksum(b"image/jpeg"),
    "image/png": sha256_checksum(b"image/png"),
    "image/webp": sha256_checksum(b"image/webp"),
}