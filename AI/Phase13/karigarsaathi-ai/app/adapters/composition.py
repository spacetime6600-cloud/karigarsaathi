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

            # Calculate placement to centre the product with padding
            # The product area with padding:
            product_width_with_padding = min(fg_width + 2 * padding, canvas_size - 32)
            product_height_with_padding = min(fg_height + 2 * padding, canvas_size - 32)

            # Ensure minimum product size
            product_width_with_padding = max(product_width_with_padding, fg_width)
            product_height_with_padding = max(product_height_with_padding, fg_height)

            # Calculate offsets to centre
            x_offset = (canvas_size - product_width_with_padding) // 2
            y_offset = (canvas_size - product_height_with_padding) // 2

            # Ensure offsets are non-negative
            x_offset = max(0, x_offset)
            y_offset = max(0, y_offset)

            # Paste the foreground onto the canvas with padding
            # Add padding border
            padded_fg_width = fg_width + 2 * padding
            padded_fg_height = fg_height + 2 * padding

            # Limit foreground size to not exceed canvas with padding
            actual_fg_w = min(fg_width, padded_fg_width)
            actual_fg_h = min(fg_height, padded_fg_height)

            # Paste the actual foreground (without the padding border,
            # the padding is just the canvas area around it)
            paste_x = x_offset + padding if x_offset + padding < canvas_size else 0
            paste_y = y_offset + padding if y_offset + padding < canvas_size else 0

            # Make sure we don't paste outside canvas
            if paste_x + actual_fg_w <= canvas_size and paste_y + actual_fg_h <= canvas_size:
                background.paste(fg_img, (paste_x, paste_y), fg_img)
            else:
                # Fallback: just centre the foreground without padding
                cent_x = (canvas_size - fg_width) // 2
                cent_y = (canvas_size - fg_height) // 2
                background.paste(fg_img, (cent_x, cent_y), fg_img)
                warnings.append("Adjusted placement - product centred without full padding")

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