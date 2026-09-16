"""Image composition and centring processor."""

from __future__ import annotations

import asyncio
from typing import Any, List, Tuple

from PIL import Image
from io import BytesIO

from app.domain.enums import BackgroundType


class ImageCompositionProcessor:
    """Image composition and product centring processor."""

    def __init__(self):
        """Initialize composition processor."""
        pass

    async def compose_image(
        self,
        foreground_rgba: bytes,
        canvas_size: int,
        padding: int = 32,
        background_type: BackgroundType = BackgroundType.WHITE,
    ) -> Dict[str, any]:
        """Compose foreground product on a square catalogue canvas.

        Args:
            foreground_rgba: RGBA foreground bytes (already background-removed)
            canvas_size: Size of square canvas (e.g., 512, 768, 1024)
            padding: Padding around product in pixels
            background_type: White or transparent background

        Returns:
            Dict with:
            - result: RGBA bytes of composed image
            - preview: bytes (320x320 preview)
            - warnings: list of warning strings
        """
        warnings: List[str] = []

        try:
            # Open foreground image
            fg_img = Image.open(BytesIO(foreground_rgba))
            fg_img = fg_img.convert("RGBA")

            fg_width, fg_height = fg_img.size

            # Calculate required canvas size with padding
            # We need at least fg_width + 2*padding by fg_height + 2*padding
            # but we want square canvas of size canvas_size
            desired_canvas_width = canvas_size
            desired_canvas_height = canvas_size

            # Create background canvas
            if background_type.value == "white":
                background = Image.new("RGBA", (canvas_size, canvas_size), (255, 255, 255, 255))
            else:
                # Transparent background
                background = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

            # Maintain neutral padding and scale product proportionally to fit
            pad = min(padding, max(8, canvas_size // 16))
            available_w = max(1, canvas_size - 2 * pad)
            available_h = max(1, canvas_size - 2 * pad)

            # Scale foreground to fit proportionally within available canvas area without any cropping
            scale = min(available_w / fg_width, available_h / fg_height)
            new_w = max(1, int(round(fg_width * scale)))
            new_h = max(1, int(round(fg_height * scale)))

            resized_fg = fg_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Calculate exact centered offsets
            paste_x = (canvas_size - new_w) // 2
            paste_y = (canvas_size - new_h) // 2

            # Paste the entire resized foreground onto the canvas using alpha mask
            background.paste(resized_fg, (paste_x, paste_y), resized_fg)

            # Generate preview (320x320)
            preview_size = (320, 320)
            preview_img = background.resize(preview_size, Image.LANCZOS)
            preview_buf = BytesIO()
            preview_img.save(preview_buf, format="PNG")
            preview_bytes = preview_buf.getvalue()

            # Convert result to bytes
            result_buf = BytesIO()
            background.save(result_buf, format="PNG")
            result_bytes = result_buf.getvalue()

            return {
                "result": result_bytes,
                "preview": preview_bytes,
                "warnings": warnings,
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise


async def compose_image_async(
    foreground_rgba: bytes,
    canvas_size: int,
    padding: int = 32,
    background_type: BackgroundType = BackgroundType.WHITE,
) -> Dict[str, any]:
    """Async wrapper for image composition."""
    processor = ImageCompositionProcessor()
    return await processor.compose_image(
        foreground_rgba, canvas_size, padding, background_type
    )