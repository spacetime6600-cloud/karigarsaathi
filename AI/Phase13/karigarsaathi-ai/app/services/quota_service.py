"""Quota service for tracking artisan enhancement limits."""

from __future__ import annotations

from datetime import datetime, date
from collections import defaultdict
import asyncio


class InMemoryQuotaService:
    """Simple in-memory quota service for prototype.

    Tracks daily job counts per artisan and concurrent processing limits.
    In production, this would be replaced with Redis or database-backed storage.
    """

    def __init__(self, default_daily_limit: int = 20):
        """Initialize quota service.

        Args:
            default_daily_limit: Maximum jobs per artisan per default day
        """
        self.default_daily_limit: int = default_daily_limit
        # artisan_id -> {date_str -> count}
        self._daily_counts: dict[str, dict[str, int]] = defaultdict(lambda: {})
        # artisan_id -> processing state
        self._currently_processing: dict[str, bool] = {}
        self._lock = asyncio.Lock()

    async def check_daily_quota(
        self, artisan_id: str, daily_limit: int | None = None
    ) -> tuple[bool, str | None]:
        """Check if artisan has quota remaining for today.

        Returns:
            (has_quota, reason_string)
        """
        limit = daily_limit or self.default_daily_limit
        today = date.today().isoformat()

        async with self._lock:
            count = self._daily_counts.get(artisan_id, {}).get(today, 0)

            if count >= limit:
                return False, f"Daily limit of {limit} jobs exceeded (used {count})"
            # Increment count
            self._daily_counts[artisan_id][today] = count + 1

        return True, None

    async def check_concurrent_processing(
        self, artisan_id: str
    ) -> tuple[bool, str | None]:
        """Check if artisan has a concurrently processing job.

        Returns:
            (can_process, reason_string)
        """
        async with self._lock:
            is_processing = self._currently_processing.get(artisan_id, False)
            if is_processing:
                return False, (
                    "Artisan already has a concurrently processing job. "
                    "Please wait for completion before starting a new one."
                )
            self._currently_processing[artisan_id] = True

        return True, None

    async def mark_job_complete(self, artisan_id: str) -> None:
        """Mark a job as complete for an artisan."""
        async with self._lock:
            self._currently_processing[artisan_id] = False

    async def get_remaining_quota(
        self, artisan_id: str, daily_limit: int | None = None
    ) -> dict[str, any]:
        """Get remaining quota for artisan today."""
        limit = daily_limit or self.default_daily_limit
        today = date.today().isoformat()

        async with self._lock:
            count = self._daily_counts.get(artisan_id, {}).get(today, 0)
            remaining = max(0, limit - count)

        return {
            "artisan_id": artisan_id,
            "daily_limit": limit,
            "used_today": count,
            "remaining": remaining,
            "date": today,
        }


# Factory function for creating quota service
def create_quota_service(
    default_daily_limit: int = 20,
) -> InMemoryQuotaService:
    """Create a quota service instance."""
    return InMemoryQuotaService(default_daily_limit=default_daily_limit)