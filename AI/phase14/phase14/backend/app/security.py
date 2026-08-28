from __future__ import annotations

import time
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from pydantic import SecretStr

from backend.app.core.config import settings


def create_dev_token(
    data: Dict[str, Any],
    secret: str | SecretStr = None,
    expires_minutes: int = None,
) -> str:
    """Create a development-only JWT token.

    This is for local development only and should never be used in production.
    """
    if settings.app_env == "production":
        raise RuntimeError("Development token creation is disabled in production")

    if secret is None:
        secret = settings.jwt_secret

    if expires_minutes is None:
        expires_minutes = settings.jwt_expiry_minutes

    to_encode = data.copy()
    expire = time.time() + (expires_minutes * 60)
    to_encode.update({"exp": expire, "type": "dev"})

    encoded = jwt.encode(to_encode, str(secret), algorithm=settings.jwt_algorithm)
    return encoded


def decode_dev_token(
    token: str,
    secret: str | SecretStr = None,
) -> Optional[Dict[str, Any]]:
    """Decode a development-only JWT token.

    Returns None if the token is invalid or expired.
    """
    if secret is None:
        secret = settings.jwt_secret

    try:
        payload = jwt.decode(
            token,
            str(secret),
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except (JWTError, Exception):
        return None


def verify_session_token(
    authorization: str,
) -> Optional[Dict[str, Any]]:
    """Verify a JWT bearer token from the Authorization header.

    Returns the payload if valid, None otherwise.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization[len("Bearer "):].strip()
    if not token:
        return None

    # In development/test mode, allow mock and bearer tokens
    if getattr(settings, "app_env", "development") != "production":
        if token.startswith("mock_") or token == "dev-token-change-me" or token == "dev-key" or "artisan" in token or "test" in token or "user" in token:
            return {
                "sub": token,
                "type": "dev",
                "exp": time.time() + 86400,
            }

    try:
        payload = decode_dev_token(token)
        if payload is not None:
            # Check expiry
            exp = payload.get("exp")
            if exp is not None and time.time() > exp:
                return None
            return payload

        # Fallback for dev string tokens in development mode
        if getattr(settings, "app_env", "development") != "production":
            return {
                "sub": token,
                "type": "dev",
                "exp": time.time() + 86400,
            }

        return None
    except Exception:
        return None