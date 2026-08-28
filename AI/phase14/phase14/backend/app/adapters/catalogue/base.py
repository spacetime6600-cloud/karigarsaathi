from __future__ import annotations

from typing import Optional, Dict, Any, List

from .errors import (
    CatalogueGenerationError,
    ModelConfigurationError,
    SchemaValidationError,
    ModelTimeoutError,
    ModelRateLimitError,
    ModelServerError,
    MalformedResponseError,
    UnexpectedFieldError,
)


class CatalogueAdapter:
    """Interface for catalogue generation adapters.

    Production adapters must implement generate_catalogue().
    Test adapters provide controlled responses for APP_ENV=test.
    """

    async def generate_catalogue(
        self, draft: Any
    ) -> Dict[str, Any]:
        """Generate bilingual catalogue content from a draft.

        Args:
            draft: The catalogue draft containing transcript and metadata.

        Returns:
            Dict with generated catalogue fields conforming to the schema.

        Raises:
            CatalogueGenerationError: If generation fails.
        """
        raise NotImplementedError("Subclasses must implement generate_catalogue()")


class FieldValidationResult:
    """Result of validating generated fields."""

    def __init__(
        self,
        valid_fields: Dict[str, Any],
        rejected_fields: List[str],
        unknown_fields: List[str],
        warnings: List[str],
    ):
        self.valid_fields = valid_fields
        self.rejected_fields = rejected_fields
        self.unknown_fields = unknown_fields
        self.warnings = warnings