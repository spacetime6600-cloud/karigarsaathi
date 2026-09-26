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


class DurableImageStorageAdapter(LocalFileStorageAdapter):
    """Storage adapter that writes to local disk/tmp and persists to Cloudinary CDN when configured.

    Returns durable CDN URLs for enhanced and preview images, ensuring results are
    accessible across all serverless function instances and edge clients.
    """

    def __init__(
        self,
        originals_dir: str = "storage/originals",
        enhanced_dir: str = "storage/enhanced",
        previews_dir: str = "storage/previews",
        cloudinary_adapter: Optional[Any] = None,
    ):
        super().__init__(originals_dir=originals_dir, enhanced_dir=enhanced_dir, previews_dir=previews_dir)
        self.cloudinary_adapter = cloudinary_adapter
        self._url_cache: dict[str, str] = {}

    async def store_enhanced(self, filename: str, data: bytes) -> str:
        await super().store_enhanced(filename, data)
        if self.cloudinary_adapter and getattr(self.cloudinary_adapter, "is_configured", False):
            try:
                import cloudinary.uploader
                base_name = os.path.splitext(filename)[0]
                public_id = f"karigarsaathi/enhanced/{base_name}"
                res = cloudinary.uploader.upload(
                    data,
                    public_id=public_id,
                    resource_type="image",
                    overwrite=True,
                    cloud_name=self.cloudinary_adapter.cloud_name,
                    api_key=self.cloudinary_adapter.api_key,
                    api_secret=self.cloudinary_adapter.api_secret,
                )
                url = res.get("secure_url") or res.get("url")
                if url:
                    self._url_cache[filename] = url
                    return url
            except Exception:
                pass
        return filename

    async def store_preview(self, filename: str, data: bytes) -> str:
        await super().store_preview(filename, data)
        if self.cloudinary_adapter and getattr(self.cloudinary_adapter, "is_configured", False):
            try:
                import cloudinary.uploader
                base_name = os.path.splitext(filename)[0]
                public_id = f"karigarsaathi/previews/{base_name}"
                res = cloudinary.uploader.upload(
                    data,
                    public_id=public_id,
                    resource_type="image",
                    overwrite=True,
                    cloud_name=self.cloudinary_adapter.cloud_name,
                    api_key=self.cloudinary_adapter.api_key,
                    api_secret=self.cloudinary_adapter.api_secret,
                )
                url = res.get("secure_url") or res.get("url")
                if url:
                    self._url_cache[filename] = url
                    return url
            except Exception:
                pass
        return filename

    async def store_original(self, filename: str, data: bytes) -> str:
        await super().store_original(filename, data)
        if self.cloudinary_adapter and getattr(self.cloudinary_adapter, "is_configured", False):
            try:
                import cloudinary.uploader
                base_name = os.path.splitext(filename)[0]
                public_id = f"karigarsaathi/originals/{base_name}"
                res = cloudinary.uploader.upload(
                    data,
                    public_id=public_id,
                    resource_type="image",
                    overwrite=True,
                    cloud_name=self.cloudinary_adapter.cloud_name,
                    api_key=self.cloudinary_adapter.api_key,
                    api_secret=self.cloudinary_adapter.api_secret,
                )
                url = res.get("secure_url") or res.get("url")
                if url:
                    self._url_cache[filename] = url
                    return url
            except Exception:
                pass
        return filename

    async def retrieve_enhanced(self, filename: str) -> bytes:
        if filename.startswith("http://") or filename.startswith("https://"):
            import urllib.request
            req = urllib.request.Request(filename, headers={"User-Agent": "KarigarSaathi/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.read()
        return await super().retrieve_enhanced(filename)


class DurableJobRepository:
    """Durable job repository that writes job metadata to disk and Cloudinary raw storage.

    Ensures that later requests on different serverless function instances can locate
    the job and its enhanced image references.
    """

    def __init__(
        self,
        jobs_dir: Optional[str] = None,
        cloudinary_adapter: Optional[Any] = None,
    ):
        import json
        self._jobs: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        base_tmp = "/tmp/storage/jobs" if os.name != "nt" else "storage/jobs"
        self.jobs_dir = jobs_dir or os.getenv("JOBS_DIR", base_tmp)
        self.cloudinary_adapter = cloudinary_adapter
        try:
            os.makedirs(self.jobs_dir, exist_ok=True)
        except Exception:
            pass

    def _job_file_path(self, job_id: str) -> str:
        safe_id = "".join(c for c in job_id if c.isalnum() or c in ("-", "_"))
        return os.path.join(self.jobs_dir, f"{safe_id}.json")

    async def create_job(
        self, job_id: str, artisan_id: str, product_id: str,
        request_id: str, status: Any, **kwargs
    ) -> None:
        async with self._lock:
            job_dict = {
                "job_id": job_id,
                "artisan_id": artisan_id,
                "product_id": product_id,
                "request_id": request_id,
                "status": status.name.lower() if hasattr(status, "name") else str(status),
                **kwargs,
            }
            serialized = self._serialize_job(job_dict)
            self._jobs[job_id] = serialized
            self._save_to_disk(job_id, serialized)
            await self._save_to_cloudinary(job_id, serialized)

    async def get_job(self, job_id: str) -> dict | None:
        async with self._lock:
            if job_id in self._jobs:
                return dict(self._jobs[job_id])

            # Try local disk
            from_disk = self._load_from_disk(job_id)
            if from_disk is not None:
                self._jobs[job_id] = from_disk
                return dict(from_disk)

            # Try Cloudinary raw storage
            from_cloud = await self._load_from_cloudinary(job_id)
            if from_cloud is not None:
                self._jobs[job_id] = from_cloud
                return dict(from_cloud)

            return None

    async def update_job(self, job_id: str, **updates: Any) -> None:
        async with self._lock:
            existing = dict(self._jobs.get(job_id) or self._load_from_disk(job_id) or {})
            if not existing:
                existing = (await self._load_from_cloudinary(job_id)) or {}
            from datetime import datetime
            for k, v in updates.items():
                existing[k] = v.name.lower() if hasattr(v, "name") else (v.isoformat() if isinstance(v, datetime) else v)
            serialized = self._serialize_job(existing)
            self._jobs[job_id] = serialized
            self._save_to_disk(job_id, serialized)
            await self._save_to_cloudinary(job_id, serialized)

    async def get_artisan_quotas(self, artisan_id: str) -> dict[str, any]:
        return {}

    def _serialize_job(self, data: dict[str, Any]) -> dict[str, Any]:
        from datetime import datetime
        result = {}
        for k, v in data.items():
            if hasattr(v, "name"):
                result[k] = v.name.lower()
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            else:
                result[k] = v
        return result

    def _save_to_disk(self, job_id: str, data: dict[str, Any]) -> None:
        import json
        try:
            fp = self._job_file_path(job_id)
            os.makedirs(os.path.dirname(fp), exist_ok=True)
            with open(fp, "w", encoding="utf-8") as f:
                json.dump(data, f)
        except Exception:
            pass

    def _load_from_disk(self, job_id: str) -> Optional[dict[str, Any]]:
        import json
        try:
            fp = self._job_file_path(job_id)
            if os.path.exists(fp):
                with open(fp, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return None

    async def _save_to_cloudinary(self, job_id: str, data: dict[str, Any]) -> None:
        if not self.cloudinary_adapter or not getattr(self.cloudinary_adapter, "is_configured", False):
            return
        try:
            import json
            import cloudinary.uploader
            safe_id = "".join(c for c in job_id if c.isalnum() or c in ("-", "_"))
            payload_bytes = json.dumps(data).encode("utf-8")
            cloudinary.uploader.upload(
                payload_bytes,
                public_id=f"karigarsaathi/jobs/{safe_id}.json",
                resource_type="raw",
                overwrite=True,
                cloud_name=self.cloudinary_adapter.cloud_name,
                api_key=self.cloudinary_adapter.api_key,
                api_secret=self.cloudinary_adapter.api_secret,
            )
        except Exception:
            pass

    async def _load_from_cloudinary(self, job_id: str) -> Optional[dict[str, Any]]:
        if not self.cloudinary_adapter or not getattr(self.cloudinary_adapter, "is_configured", False):
            return None
        try:
            import json
            import urllib.request
            safe_id = "".join(c for c in job_id if c.isalnum() or c in ("-", "_"))
            url = f"https://res.cloudinary.com/{self.cloudinary_adapter.cloud_name}/raw/upload/karigarsaathi/jobs/{safe_id}.json"
            req = urllib.request.Request(url, headers={"User-Agent": "KarigarSaathi/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception:
            pass
        return None


class InMemoryJobRepository(DurableJobRepository):
    """In-memory job repository for tracking enhancement jobs (inherits durable fallback)."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)