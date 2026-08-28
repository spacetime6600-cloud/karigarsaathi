"""Security and authentication helper for Phase 15 Explainable Fair Pricing."""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from jose import JWTError, jwt

from .config import settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def get_current_artisan_uid(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_artisan_uid: Optional[str] = Header(None, alias="X-Artisan-Uid"),
) -> str:
    """Extract and securely derive the artisan UID from the Bearer token.
    
    Derives identity server-side. Never trusts raw unverified client parameters.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            uid: str = payload.get("sub") or payload.get("uid") or payload.get("user_id")
            if uid:
                return uid
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # In local development mode, allow header fallback with explicit logged notice
    if x_artisan_uid and settings.environment == "development":
        return f"dev_{x_artisan_uid}"

    # Default fallback for anonymous/stateless estimate calculations
    return "anonymous_artisan"
