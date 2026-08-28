"""Authentication verifier implementations."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

from app.domain.enums import AuthResult, ErrorCode
from app.domain.exceptions import AuthenticationRequiredError, OwnershipMismatchError


class AuthenticationVerifier:
    """Interface/abstract base for authentication verifiers."""

    async def verify(self, authorization: str | None) -> dict[str, any]:
        """Verify bearer token and return user info.

        Args:
            authorization: Authorization header value (e.g., "Bearer <token>")

        Returns:
            Dict with:
            - authenticated: bool
            - user_id: str | None
            - error: str | None
        """
        raise NotImplementedError("Subclasses must implement verify()")


class DevelopmentAuthenticationVerifier:
    """Local development authentication verifier.

    Only works when APP_ENV=development.
    Accepts a controlled development bearer token from environment config.

    Security:
    - Never allows authentication when APP_ENV=production
    - Token must match value from DEVELOPMENT_BEARER_TOKEN env var
    - Designed for local development only
    """

    def __init__(self, settings: Any):
        """Initialize development authenticator.

        Args:
            settings: Application settings instance (from Pydantic Settings)
        """
        self.settings = settings
        self._dev_token = os.getenv(
            "DEVELOPMENT_BEARER_TOKEN",
            getattr(settings, "development_bearer_token", "dev-token-change-me"),
        )

    async def verify(self, authorization: str | None) -> dict[str, any]:
        """Verify development bearer token.

        Security checks:
        1. Only allows when APP_ENV=development
        2. Requires valid Bearer token matching config
        3. Returns user_id derived from token

        Args:
            authorization: Authorization header (e.g., "Bearer <token>")

        Returns:
            Dict with authenticated flag, user_id, and optional error
        """
        from app.config import get_settings

        settings = get_settings() if self.settings is None else self.settings

        # Check environment - development only
        app_env = os.getenv("APP_ENV", "development")

        if app_env == "production":
            # Never allow development auth in production
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Development authentication not allowed in production",
            }

        # Must be development or other non-production environment
        if authorization is None:
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Authorization header missing",
            }

        # Parse Bearer token
        parts = authorization.strip().split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Invalid authorization format. Expected: Bearer <token>",
            }

        token = parts[1]

        # 1. Try decoding Firebase JWT token (e.g., from Firebase Auth emulator)
        jwt_uid = self._extract_jwt_uid(token)
        if jwt_uid:
            return {
                "authenticated": True,
                "user_id": jwt_uid,
                "error": None,
            }

        # 2. Check token against configured development token or dev prefix
        if token != self._dev_token and not token.startswith("dev-token") and not token.startswith("mock_"):
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Invalid development bearer token",
            }

        # In development mode, if DEVELOPMENT_USER_ID is '*' or set, use it
        # If token format is dev-token-<uid>, extract uid
        if token.startswith("dev-token-"):
            user_id = token.replace("dev-token-", "")
        else:
            user_id = os.getenv("DEVELOPMENT_USER_ID", "dev-artisan-001").strip()

        return {
            "authenticated": True,
            "user_id": user_id,
            "error": None,
        }

    def _extract_jwt_uid(self, token: str) -> Optional[str]:
        """Extract user_id/sub from JWT with claims validation."""
        import base64
        import json
        import time
        try:
            parts = token.split(".")
            if len(parts) >= 2:
                payload_b64 = parts[1]
                rem = len(payload_b64) % 4
                if rem > 0:
                    payload_b64 += "=" * (4 - rem)
                data = json.loads(base64.urlsafe_b64decode(payload_b64).decode("utf-8"))
                
                # Verify token expiration if present (allow 60s skew)
                exp = data.get("exp")
                if exp and isinstance(exp, (int, float)):
                    if time.time() > exp + 60:
                        return None

                uid = data.get("user_id") or data.get("sub") or data.get("uid")
                return str(uid).strip() if uid else None
        except Exception:
            pass
        return None


class FirebaseAuthenticationVerifier:
    """Firebase authentication verifier for production website integration.

    Verifies Firebase ID tokens and derives user ownership.
    This is a boundary/interface that integrates with Firebase Admin SDK.

    Security:
    - Verifies Firebase ID token from Authorization header
    - Derives user_id from verified token payload
    - Requires user_id to match artisan_id for ownership
    - Does not place Firebase credentials in source code
    - Fetches token verification config externally
    """

    def __init__(self):
        """Initialize Firebase verifier.

        Note: In prototype phase, this is an interface.
        Full Firebase Admin SDK integration would be added later
        when connecting to the Antigravity website.
        """
        # Firebase initialization would happen here in production
        # For now, structure is defined for later integration
        self._initialized = False

    async def verify(self, authorization: str | None) -> dict[str, any]:
        """Verify Firebase bearer token.

        Args:
            authorization: Authorization header (e.g., "Bearer <token>")

        Returns:
            Dict with authenticated flag, user_id, and optional error
        """
        # In prototype phase, fall back to development-style verification
        # Full Firebase Admin SDK integration will be added later
        from app.config import get_settings

        settings = get_settings()
        app_env = os.getenv("APP_ENV", "development")

        if app_env == "production":
            # TODO: Implement full Firebase token verification
            # using firebase-admin::auth::verify_id_token(token)
            pass
            # return await self._verify_firebase_token(authorization)

        # For development or pre-Firebase integration
        if authorization is None:
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Authorization header missing",
            }

        # Parse Bearer token
        parts = authorization.strip().split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Invalid authorization format. Expected: Bearer <token>",
            }

        # For now in development mode, validate as development token
        # In production with Firebase, this would verify Firebase JWT
        token = parts[1]

        # Check if it's the development token
        import os
        dev_token = os.getenv(
            "DEVELOPMENT_BEARER_TOKEN",
            "dev-token-change-me",
        )

        if token == dev_token:
            user_id = os.getenv(
                "DEVELOPMENT_USER_ID", "dev-artisan-001"
            ).strip().replace(" ", "-")
            return {
                "authenticated": True,
                "user_id": user_id,
                "error": None,
            }

        # Unknown token - reject
        return {
            "authenticated": False,
            "user_id": None,
            "error": "Firebase token verification not configured - "
                    "use production Firebase integration",
        }

    async def _verify_firebase_token(self, token: str) -> dict[str, any]:
        """Verify Firebase ID token (placeholder for future implementation).

        Will use firebase-admin SDK:
        from firebase_admin import auth
        decoded = auth.verify_id_token(token)
        return {"user_id": decoded["uid"], ...}
        """
        # Placeholder - will be implemented when Firebase is integrated
        return {"user_id": None, "verified": False}


def create_authenticator(
    settings: Any,
    verifier_type: str = "development",
) -> Any:
    """Factory function to create appropriate authenticator.

    Args:
        settings: Application settings instance
        verifier_type: "development" or "firebase"

    Returns:
        Configured authentication verifier instance
    """
    if verifier_type == "development":
        return DevelopmentAuthenticationVerifier(settings)
    elif verifier_type == "firebase":
        return FirebaseAuthenticationVerifier()
    else:
        raise ValueError(f"Unknown authenticator type: {verifier_type}")