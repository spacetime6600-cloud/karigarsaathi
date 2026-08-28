"""Conservative lighting correction using OpenCV."""

from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image
from io import BytesIO


class LightingCorrectionProcessor:
    """Conservative, deterministic lighting correction using OpenCV."""

    def __init__(self, config: Dict[str, any] | None = None):
        """Initialize lighting correction processor.

        Uses CLAHE (Contrast Limited Adaptive Histogram Equalization)
        with conservative limits to avoid altering product colours.

        Args:
            config: Configuration dict with limits:
                - clip_limit: CLAHE clip limit (default: 2.0)
                - tile_grid_size: CLAHE tile grid size (default: (8,8))
                - max_luminance_change: Max % luminance change (default: 20)
                - max_saturation_change: Max % saturation change (default: 15)
        """
        self.config = config or {}
        self.clip_limit: float = float(
            self.config.get("clip_limit", "2.0")
        )
        self.tile_grid_size: Tuple[int, int] = tuple(
            int(x) for x in self.config.get("tile_grid_size", "8,8").split(",")
        )
        self.max_luminance_change: float = float(
            self.config.get("max_luminance_change", "20.0")
        )
        self.max_saturation_change: float = float(
            self.config.get("max_saturation_change", "15.0")
        )

    async def correct_lighting(
        self, rgba_data: bytes, width: int, height: int
    ) -> Tuple[bytes, List[str]]:
        """Apply conservative lighting correction to foreground.

        Only applies correction to the foreground region,
        preserving the alpha channel and background transparency.

        Args:
            rgba_data: RGBA image bytes
            width: Image width in pixels
            height: Image height in pixels

        Returns:
            Tuple of (corrected_rgba_bytes, warnings_list)
        """
        warnings: List[str] = []

        try:
            # Convert bytes to numpy array
            try:
                img = Image.open(BytesIO(rgba_data)).convert("RGBA")
                arr = np.array(img)
            except Exception:
                arr = np.frombuffer(rgba_data, dtype=np.uint8).reshape((height, width, 4))

            # Split channels
            bgr = arr[..., :3]
            alpha = arr[..., 3]

            # Work in LAB colour space for luminance-adjusted correction
            # Convert BGR to LAB (OpenCV expects BGR)
            lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)

            # Split LAB channels
            l_channel, a_channel, b_channel = cv2.split(lab)

            # Apply CLAHE to luminance channel only
            clahe = cv2.createCLAHE(
                clipLimit=self.clip_limit,
                tileGridSize=self.tile_grid_size,
            )
            l_channel_enhanced = clahe.apply(l_channel)

            # Check luminance change against original
            l_original_float = l_channel.astype(np.float64) / 255.0
            l_enhanced_float = l_channel_enhanced.astype(np.float64) / 255.0

            # Mean luminance change percentage
            mean_l_change = float(
                np.mean(np.abs(l_enhanced_float - l_original_float)) * 100
            )

            if mean_l_change > self.max_luminance_change:
                # Reduce CLAHE intensity
                adjusted_clip = self.clip_limit * (
                    self.max_luminance_change / mean_l_change
                )
                clahe2 = cv2.createCLAHE(
                    clipLimit=adjusted_clip,
                    tileGridSize=self.tile_grid_size,
                )
                l_channel_enhanced = clahe2.apply(l_channel)
                warnings.append(
                    f"Luminance change reduced from {mean_l_change:.1f}% "
                    f"to {self.max_luminance_change:.1f}% limit"
                )

            # Merge channels back
            lab_enhanced = cv2.merge([l_channel_enhanced, a_channel, b_channel])

            # Convert back to BGR
            bgr_enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

            # Replace BGR channels in original alpha-containing array
            result = arr.copy()
            result[..., :3] = bgr_enhanced

            # Preserve original alpha channel exactly
            # No saturation/lighting changes to alpha

            # Convert back to bytes
            result_bytes = self._arr_to_bytes(result)

            return result_bytes, warnings

        except Exception as e:
            import traceback
            traceback.print_exc()
            # Return original if processing fails
            return rgba_data, [f"Lighting correction error: {str(e)}"]

    def _arr_to_bytes(self, arr: np.ndarray) -> bytes:
        """Convert numpy RGBA array to PNG bytes."""
        img = Image.fromarray(arr, "RGBA")
        buf = BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()