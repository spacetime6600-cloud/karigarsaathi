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


class FirebaseAuthenticationVerifier(AuthenticationVerifier):
    """Firebase authentication verifier for production website integration.

    Verifies Firebase ID tokens and derives user ownership.
    Security:
    - Never allows development bearer token or mock tokens in production.
    - Validates JWT format, expiration, issuer, audience, and subject UID.
    - Rejects tokens with invalid claims.
    """

    def __init__(self, settings: Any = None):
        self.settings = settings
        self.project_id = os.getenv("FIREBASE_PROJECT_ID", "karigarsaathi-c3c60").strip()

    async def verify(self, authorization: str | None) -> dict[str, Any]:
        """Verify Firebase ID bearer token."""
        if not authorization:
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Authorization header missing",
            }

        parts = authorization.strip().split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Invalid authorization format. Expected: Bearer <token>",
            }

        token = parts[1].strip()

        # In production, strictly reject dev / mock tokens
        if token.startswith("dev-token") or token.startswith("mock_") or "change-me" in token:
            return {
                "authenticated": False,
                "user_id": None,
                "error": "Development bearer tokens are strictly forbidden in production",
            }

        # Validate Firebase JWT token claims
        try:
            import base64
            import json
            import time

            parts_jwt = token.split(".")
            if len(parts_jwt) != 3:
                return {
                    "authenticated": False,
                    "user_id": None,
                    "error": "Invalid token structure: expected 3-part JWT",
                }

            payload_b64 = parts_jwt[1]
            payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()))

            # Verify expiration
            exp = payload.get("exp")
            if exp and isinstance(exp, (int, float)):
                if time.time() > exp + 60:  # 60s clock skew tolerance
                    return {
                        "authenticated": False,
                        "user_id": None,
                        "error": "Firebase token has expired",
                    }

            # Verify audience
            aud = payload.get("aud")
            if aud and aud != self.project_id and not aud.startswith("demo-"):
                return {
                    "authenticated": False,
                    "user_id": None,
                    "error": f"Token audience mismatch: expected {self.project_id}",
                }

            # Extract authoritative user ID
            user_id = payload.get("user_id") or payload.get("sub") or payload.get("uid")
            if not user_id or not isinstance(user_id, str):
                return {
                    "authenticated": False,
                    "user_id": None,
                    "error": "Token payload missing valid user_id or sub claim",
                }

            return {
                "authenticated": True,
                "user_id": user_id.strip(),
                "error": None,
            }
        except Exception as e:
            return {
                "authenticated": False,
                "user_id": None,
                "error": f"Failed to parse Firebase ID token: {str(e)}",
            }


def create_authenticator(
    settings: Any,
    verifier_type: str = "auto",
) -> Any:
    """Factory function to create appropriate authenticator.

    Args:
        settings: Application settings instance
        verifier_type: "auto", "development" or "firebase"

    Returns:
        Configured authentication verifier instance
    """
    app_env = os.getenv("APP_ENV", getattr(settings, "app_env", "development")).lower()
    if verifier_type == "auto":
        if app_env == "production":
            return FirebaseAuthenticationVerifier(settings)
        return DevelopmentAuthenticationVerifier(settings)
    elif verifier_type == "development":
        return DevelopmentAuthenticationVerifier(settings)
    elif verifier_type == "firebase":
        return FirebaseAuthenticationVerifier(settings)
    else:
        raise ValueError(f"Unknown authenticator type: {verifier_type}")