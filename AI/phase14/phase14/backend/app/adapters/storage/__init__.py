from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, BinaryIO
from dataclasses import dataclass

from backend.app.core.config import settings


@dataclass
class StoredFile:
    """Represents a stored file with metadata."""

    file_id: str
    original_filename: str
    stored_filename: str
    file_path: str
    file_size: int
    content_type: str | None = None


class StorageAdapter:
    """Interface for private file storage.

    Handles secure storage of audio files with path traversal protection,
    generated filenames, and configurable size limits.
    """

    def __init__(self, base_dir: str | None = None):
        """Initialize the storage adapter.

        Args:
            base_dir: Base directory for private storage. Defaults to
                settings.private_upload_dir.
        """
        self._base_dir = Path(base_dir or settings.private_upload_dir)
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def store(self, file_data: bytes, original_filename: str, content_type: str | None = None) -> StoredFile:
        """Store a file securely with a generated filename.

        Args:
            file_data: The file content as bytes.
            original_filename: The original filename from the upload.
            content_type: Optional MIME content type.

        Returns:
            StoredFile with metadata about the stored file.

        Raises:
            ValueError: If the file is empty or original_filename is invalid.
        """
        if not file_data:
            raise ValueError("Cannot store empty file")
        if not original_filename:
            raise ValueError("Original filename is required")

        # Generate safe filename with UUID
        ext = Path(original_filename).suffix.lower()
        if not ext:
            ext = ".bin"
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = self._base_dir / safe_filename

        # Ensure the path is within base directory (path traversal protection)
        try:
            file_path.resolve().relative_to(self._base_dir.resolve())
        except ValueError:
            raise ValueError("Invalid file path")

        # Write file
        with open(file_path, "wb") as f:
            f.write(file_data)

        return StoredFile(
            file_id=safe_filename,
            original_filename=original_filename,
            stored_filename=safe_filename,
            file_path=str(file_path),
            file_size=len(file_data),
            content_type=content_type,
        )

    def retrieve(self, stored_filename: str) -> Optional[bytes]:
        """Retrieve a stored file by its stored filename.

        Args:
            stored_filename: The generated filename returned by store().

        Returns:
            File content as bytes, or None if not found.
        """
        file_path = self._base_dir / stored_filename

        # Path traversal protection
        try:
            file_path.resolve().relative_to(self._base_dir.resolve())
        except ValueError:
            return None

        if not file_path.exists():
            return None

        with open(file_path, "rb") as f:
            return f.read()

    def delete(self, stored_filename: str) -> bool:
        """Delete a stored file.

        Args:
            stored_filename: The generated filename returned by store().

        Returns:
            True if file was deleted, False if not found.
        """
        file_path = self._base_dir / stored_filename

        # Path traversal protection
        try:
            file_path.resolve().relative_to(self._base_dir.resolve())
        except ValueError:
            return False

        if not file_path.exists():
            return False

        try:
            file_path.unlink()
            return True
        except OSError:
            return False

    def exists(self, stored_filename: str) -> bool:
        """Check if a stored file exists.

        Args:
            stored_filename: The generated filename returned by store().

        Returns:
            True if file exists, False otherwise.
        """
        file_path = self._base_dir / stored_filename

        # Path traversal protection
        try:
            file_path.resolve().relative_to(self._base_dir.resolve())
        except ValueError:
            return False

        return file_path.exists()

    def get_file_path(self, stored_filename: str) -> Optional[str]:
        """Get the absolute file path for a stored file.

        Args:
            stored_filename: The generated filename returned by store().

        Returns:
            Absolute file path as string, or None if not found.
        """
        file_path = self._base_dir / stored_filename

        # Path traversal protection
        try:
            file_path.resolve().relative_to(self._base_dir.resolve())
        except ValueError:
            return None

        if not file_path.exists():
            return None

        return str(file_path.resolve())

    def get_file_size(self, stored_filename: str) -> Optional[int]:
        """Get the size of a stored file in bytes.

        Args:
            stored_filename: The generated filename returned by store().

        Returns:
            File size in bytes, or None if not found.
        """
        file_path = self._base_dir / stored_filename

        # Path traversal protection
        try:
            file_path.resolve().relative_to(self._base_dir.resolve())
        except ValueError:
            return None

        if not file_path.exists():
            return None

        return file_path.stat().st_size


# Global storage instance
_storage_adapter: StorageAdapter | None = None


def get_storage_adapter() -> StorageAdapter:
    """Get the global storage adapter instance."""
    global _storage_adapter
    if _storage_adapter is None:
        _storage_adapter = StorageAdapter()
    return _storage_adapter