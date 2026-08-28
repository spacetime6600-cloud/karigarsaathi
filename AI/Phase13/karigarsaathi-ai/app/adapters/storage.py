"""Local file system storage adapter implementing the storage protocol."""

from __future__ import annotations

import os
import asyncio
from typing import Any

from app.domain.interfaces import ImageStorageProtocol


class LocalFileStorageAdapter(ImageStorageProtocol):
    """Local file system storage adapter."""

    def __init__(
        self,
        originals_dir: str = "storage/originals",
        enhanced_dir: str = "storage/enhanced",
        previews_dir: str = "storage/previews",
    ):
        """Initialize storage adapter with directory paths.

        Args:
            originals_dir: Path for original images
            enhanced_dir: Path for enhanced images
            previews_dir: Path for preview images
        """
        self.originals_dir = originals_dir
        self.enhanced_dir = enhanced_dir
        self.previews_dir = previews_dir
        self._lock = asyncio.Lock()

    async def _ensure_dirs(self) -> None:
        """Ensure all required directories exist."""
        for d in [self.originals_dir, self.enhanced_dir, self.previews_dir]:
            os.makedirs(d, exist_ok=True)

    async def store_original(self, filename: str, data: bytes) -> str:
        """Store an original image immutably.

        Args:
            filename: Storage filename
            data: Image bytes

        Returns:
            Stored filename/path
        """
        async with self._lock:
            await self._ensure_dirs()
            filepath = os.path.join(self.originals_dir, filename)
            # Write once - immutable
            with open(filepath, "wb") as f:
                f.write(data)
            return filename

    async def retrieve_original(self, filename: str) -> bytes:
        """Retrieve an original image by filename.

        Args:
            filename: Storage filename

        Returns:
            Image bytes
        """
        filepath = os.path.join(self.originals_dir, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Original not found: {filename}")
        with open(filepath, "rb") as f:
            return f.read()

    async def store_enhanced(self, filename: str, data: bytes) -> str:
        """Store an enhanced image.

        Args:
            filename: Storage filename
            data: Image bytes

        Returns:
            Stored filename/path
        """
        async with self._lock:
            await self._ensure_dirs()
            filepath = os.path.join(self.enhanced_dir, filename)
            with open(filepath, "wb") as f:
                f.write(data)
            return filename

    async def retrieve_enhanced(self, filename: str) -> bytes:
        """Retrieve an enhanced image by filename.

        Args:
            filename: Storage filename

        Returns:
            Image bytes
        """
        filepath = os.path.join(self.enhanced_dir, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Enhanced not found: {filename}")
        with open(filepath, "rb") as f:
            return f.read()

    async def store_preview(self, filename: str, data: bytes) -> str:
        """Store a preview image.

        Args:
            filename: Storage filename
            data: Image bytes

        Returns:
            Stored filename/path
        """
        async with self._lock:
            await self._ensure_dirs()
            filepath = os.path.join(self.previews_dir, filename)
            with open(filepath, "wb") as f:
                f.write(data)
            return filename

    async def retrieve_preview(self, filename: str) -> bytes:
        """Retrieve a preview image by filename.

        Args:
            filename: Storage filename

        Returns:
            Image bytes
        """
        filepath = os.path.join(self.previews_dir, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Preview not found: {filename}")
        with open(filepath, "rb") as f:
            return f.read()

    async def original_exists(self, filename: str) -> bool:
        """Check if an original image exists."""
        filepath = os.path.join(self.originals_dir, filename)
        return os.path.exists(filepath)

    async def enhanced_exists(self, filename: str) -> bool:
        """Check if an enhanced image exists."""
        filepath = os.path.join(self.enhanced_dir, filename)
        return os.path.exists(filepath)

    async def preview_exists(self, filename: str) -> bool:
        """Check if a preview image exists."""
        filepath = os.path.join(self.previews_dir, filename)
        return os.path.exists(filepath)


class InMemoryJobRepository:
    """In-memory job repository for tracking enhancement jobs."""

    def __init__(self):
        self._jobs: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, job_id: str, artisan_id: str, product_id: str,
                         request_id: str, status: Any, **kwargs) -> None:
        async with self._lock:
            self._jobs[job_id] = {
                "job_id": job_id,
                "artisan_id": artisan_id,
                "product_id": product_id,
                "request_id": request_id,
                "status": status,
                **kwargs,
            }

    async def get_job(self, job_id: str) -> dict | None:
        async with self._lock:
            return self._jobs.get(job_id)

    async def update_job(self, job_id: str, **updates: Any) -> None:
        async with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(updates)

    async def get_artisan_quotas(self, artisan_id: str) -> dict[str, any]:
        return {}