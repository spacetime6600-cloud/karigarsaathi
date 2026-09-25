"""Rembg-based background removal adapter."""

from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Tuple

import numpy as np
from PIL import Image
from io import BytesIO

from app.domain.interfaces import (
    BackgroundRemovalAdapterProtocol,
    ImageStorageProtocol,
)


class RembgBackgroundRemovalAdapter:
    """Background removal using rembg with cached u2net neural network."""

    def __init__(self, model_name: str = "u2netp"):
        """Initialize the rembg background removal adapter.

        Args:
            model_name: Name of the rembg model to use (default: 'u2netp').
        """
        import os
        self.model_name = os.getenv("REMBG_MODEL", model_name)
        self._session = None

    @property
    def is_model_ready(self) -> bool:
        """Check whether the model session is loaded and ready."""
        return self._session is not None

    def _get_session(self):
        """Get or initialize the rembg ONNX session."""
        if self._session is None:
            import rembg
            self._session = rembg.new_session(self.model_name)
        return self._session

    async def remove_background(
        self, image_data: bytes, width: int, height: int
    ) -> Dict[str, any]:
        """Remove background from image using rembg.

        Args:
            image_data: Raw image bytes (RGB or RGBA)
            width: Image width in pixels
            height: Image height in pixels

        Returns:
            Dict with:
            - foreground: RGBA bytes of foreground result
            - mask: mask bytes (grayscale)
            - foreground_coverage: float (0-1, proportion of foreground pixels)
            - warnings: list of warning strings about suspicious masks
        """
        warnings: List[str] = []

        try:
            # Resize image down to max 1024 if needed to avoid excessive memory consumption
            def _process():
                import rembg
                session = self._get_session()
                # If image is very large, downscale safely
                try:
                    pil_img = Image.open(BytesIO(image_data))
                    orig_w, orig_h = pil_img.size
                    max_dim = max(orig_w, orig_h)
                    if max_dim > 1024:
                        scale = 1024 / max_dim
                        new_w = int(orig_w * scale)
                        new_h = int(orig_h * scale)
                        pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                        buf = BytesIO()
                        pil_img.save(buf, format="PNG")
                        proc_bytes = buf.getvalue()
                    else:
                        proc_bytes = image_data
                except Exception:
                    proc_bytes = image_data

                # Fast, high-quality rembg removal without expensive CPU matting
                return rembg.remove(proc_bytes, session=session, alpha_matting=False)

            foreground_rgba = await asyncio.get_event_loop().run_in_executor(
                None, _process
            )

            # Calculate foreground coverage (proportion of non-transparent pixels)
            fg_coverage = self._calculate_foreground_coverage(foreground_rgba, width, height)

            # Validate mask safety
            mask_warnings = self._validate_mask_safety(
                foreground_rgba, width, height
            )
            warnings.extend(mask_warnings)

            # If mask is deemed suspicious, return fallback warning
            if any("SUSPICIOUS" in w or "REJECTED" for w in mask_warnings):
                return {
                    "foreground": foreground_rgba,
                    "mask": None,
                    "foreground_coverage": fg_coverage,
                    "warnings": mask_warnings,
                    "fallback": True,
                }

            return {
                "foreground": foreground_rgba,
                "mask": foreground_rgba,  # Use foreground as mask reference
                "foreground_coverage": fg_coverage,
                "warnings": warnings,
                "fallback": False,
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "foreground": image_data if isinstance(image_data, bytes) else b"",
                "mask": None,
                "foreground_coverage": 0.0,
                "warnings": [f"Segmentation failed: {str(e)}"],
                "fallback": True,
            }

    def _argb_to_rgba(self, argb_data: bytes) -> bytes:
        """Convert ARGB bytes to RGBA.

        rembg returns pixels in ARGB format (Alpha, Red, Green, Blue)
        but we need RGBA (Red, Green, Blue, Alpha).
        """
        # rembg returns raw RGBA data actually, no conversion needed
        # The function returns RGBA directly
        return argb_data

    def _bytes_to_rgba_arr(self, rgba_data: bytes, width: int, height: int) -> np.ndarray:
        """Decode image bytes to RGBA numpy array safely."""
        try:
            img = Image.open(BytesIO(rgba_data)).convert("RGBA")
            return np.array(img)
        except Exception:
            try:
                return np.frombuffer(rgba_data, dtype=np.uint8).reshape((height, width, 4))
            except Exception:
                return np.zeros((height, width, 4), dtype=np.uint8)

    def _calculate_foreground_coverage(
        self, rgba_data: bytes, width: int, height: int
    ) -> float:
        """Calculate proportion of foreground (non-transparent) pixels.

        Returns value in range [0, 1].
        """
        try:
            arr = self._bytes_to_rgba_arr(rgba_data, width, height)
            # Count non-transparent pixels (alpha > 0)
            fg_pixels = np.sum(arr[..., 3] > 0)
            total_pixels = arr.shape[0] * arr.shape[1]
            return float(fg_pixels / total_pixels) if total_pixels > 0 else 0.0
        except Exception:
            return 0.0

    def _validate_mask_safety(
        self, rgba_data: bytes, width: int, height: int
    ) -> List[str]:
        """Validate the alpha mask for suspicious patterns.

        Checks:
        - Foreground below 5% (likely no product detected)
        - Foreground above 98% (likely no background removed)
        - Product touching excessive canvas boundaries
        - Excessive internal holes in the product
        - Nearly empty alpha mask

        Returns list of warning strings (empty if safe).
        """
        warnings: List[str] = []
        arr = self._bytes_to_rgba_arr(rgba_data, width, height)
        alpha_channel = arr[..., 3]

        # Foreground ratio
        fg_pixels = np.sum(alpha_channel > 0)
        total_pixels = alpha_channel.size
        fg_ratio = fg_pixels / total_pixels if total_pixels > 0 else 1.0

        # Check 1: Foreground below 5%
        if fg_ratio < 0.05:
            warnings.append(
                "SUSPICIOUS: Foreground ratio below 5% - "
                "product may not have been detected"
            )

        # Check 2: Foreground above 98%
        if fg_ratio > 0.98:
            warnings.append(
                "SUSPICIOUS: Foreground ratio above 98% - "
                "background may not have been properly removed"
            )

        # Check 3: Product touching excessive canvas boundaries
        # If foreground touches the edge of the image on any side,
        # it may be losing product content
        margin = width // 10  # 10% margin
        if margin > 0:
            # Check if any non-transparent pixels exist in the margin zones
            top_margin = alpha_channel[0:margin, :].sum()
            bottom_margin = alpha_channel[height - margin:height, :].sum()
            left_margin = alpha_channel[:, 0:margin].sum()
            right_margin = alpha_channel[:, width - margin:width].sum()

            if top_margin > 0 or bottom_margin > 0:
                warnings.append(
                    "SUSPICIOUS: Product touches top canvas boundary"
                )
            if bottom_margin > 0 or bottom_margin > 0:
                warnings.append(
                    "SUSPICIOUS: Product touches bottom canvas boundary"
                )
            if left_margin > 0:
                warnings.append(
                    "SUSPICIOUS: Product touches left canvas boundary"
                )
            if right_margin > 0:
                warnings.append(
                    "SUSPICIOUS: Product touches right canvas boundary"
                )

        # Check 4: Excessive internal holes
        # Count connected components of foreground minus the main component
        # Simple approach: count zero-alpha "islands" surrounded by foreground
        # This is a heuristic - count small foreground regions surrounded by transparent
        try:
            from scipy import ndimage

            # Binary mask: 1 for foreground, 0 for background
            binary_mask = (alpha_channel > 0).astype(np.uint8)

            # Label connected components (8-connectivity for foreground)
            labeled_mask, num_components = ndimage.label(binary_mask)

            if num_components > 1:
                # There are multiple components; find sizes
                component_sizes = [
                    np.sum(labeled_mask == i) for i in range(1, num_components + 1)
                ]
                # Sort sizes descending
                component_sizes.sort(reverse=True)

                # If there are small components (beyond the largest = main product),
                # they might be holes or noise
                if len(component_sizes) > 1:
                    main_component_size = component_sizes[0]
                    # If second largest is >5% of main, might be legitimate second object
                    # If much smaller, might be holes
                    second_size = component_sizes[1]
                    if second_size < main_component_size * 0.05:
                        # Many tiny holes - check count
                        small_holes = sum(
                            1 for s in component_sizes[1:] if s < main_component_size * 0.01
                        )
                        if small_holes > 20:
                            warnings.append(
                                "SUSPICIOUS: Excessive internal holes detected "
                                f"({small_holes} small holes)"
                            )
        except Exception:
            # scipy not available - skip detailed hole analysis
            pass

        # Check 5: Nearly empty alpha mask
        if total_pixels > 0 and fg_pixels < max(1, total_pixels * 0.01):
            warnings.append(
                "SUSPICIOUS: Nearly empty alpha mask - "
                "very little foreground detected"
            )

        return warnings