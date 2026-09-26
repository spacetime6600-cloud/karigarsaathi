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

    def __init__(self, model_name: str = "u2netp", enable_ml: bool | None = None):
        """Initialize the rembg background removal adapter.

        Args:
            model_name: Name of the rembg model to use (default: 'u2netp').
            enable_ml: Whether ML background removal is enabled (default from ENABLE_ML_BACKGROUND_REMOVAL).
        """
        import os
        self.model_name = os.getenv("REMBG_MODEL", model_name)
        if enable_ml is not None:
            self.enable_ml = enable_ml
        else:
            self.enable_ml = os.getenv("ENABLE_ML_BACKGROUND_REMOVAL", "false").lower() in ("true", "1", "yes")
        self._session = None

        # Point U2NET_HOME to bundled models directory if present
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        models_dir = os.path.join(base_dir, "models")
        if os.path.exists(os.path.join(models_dir, f"{self.model_name}.onnx")):
            os.environ.setdefault("U2NET_HOME", models_dir)
        else:
            os.environ.setdefault("U2NET_HOME", "/tmp/models")

    @property
    def is_model_ready(self) -> bool:
        """Check whether the model session is loaded and ready."""
        return self._session is not None

    def _get_session(self):
        """Get or initialize the ONNX session with strict low-memory settings."""
        if self._session is None:
            import os
            import logging
            import onnxruntime as ort

            _logger = logging.getLogger(__name__)

            # Discover bundled models directory
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            models_dir = os.path.join(base_dir, "models")
            candidate_paths = [
                os.path.join(models_dir, f"{self.model_name}.onnx"),
                os.path.join(os.getenv("U2NET_HOME", ""), f"{self.model_name}.onnx"),
                os.path.expanduser(f"~/.u2net/{self.model_name}.onnx"),
                f"/tmp/models/{self.model_name}.onnx",
            ]
            model_path = next((p for p in candidate_paths if p and os.path.exists(p)), None)

            if not model_path:
                # If not bundled locally, download u2netp weights to writable /tmp/models
                import urllib.request
                target_dir = os.getenv("U2NET_HOME") or "/tmp/models"
                os.makedirs(target_dir, exist_ok=True)
                model_path = os.path.join(target_dir, f"{self.model_name}.onnx")
                url = f"https://github.com/danielgatis/rembg/releases/download/v0.0.0/{self.model_name}.onnx"
                _logger.info("Downloading %s model to %s...", self.model_name, model_path)
                urllib.request.urlretrieve(url, model_path)

            _logger.info("Loading %s model from %s", self.model_name, model_path)
            sess_opts = ort.SessionOptions()
            sess_opts.enable_cpu_mem_arena = False
            sess_opts.inter_op_num_threads = 1
            sess_opts.intra_op_num_threads = 1
            sess_opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL

            _logger.info("Initializing ONNX session [%s, cpu_arena=False, threads=1]", self.model_name)
            self._session = ort.InferenceSession(
                model_path,
                sess_options=sess_opts,
                providers=["CPUExecutionProvider"],
            )
            _logger.info("ONNX session ready [%s]", self.model_name)
        return self._session

    async def remove_background(
        self, image_data: bytes, width: int, height: int
    ) -> Dict[str, any]:
        """Remove background from image using native ONNX u2netp model.

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
        if not self.enable_ml:
            return {
                "foreground": image_data,
                "mask": None,
                "foreground_coverage": 1.0,
                "warnings": [
                    "Background removal omitted for free-tier stability. Authentic background preserved."
                ],
                "fallback": True,
            }

        import gc
        warnings: List[str] = []

        try:
            # Resize image down to max 512 to bound memory strictly under Render 512MB limit
            def _process():
                session = self._get_session()
                try:
                    pil_img = Image.open(BytesIO(image_data))
                    orig_w, orig_h = pil_img.size
                    max_dim = max(orig_w, orig_h)
                    if max_dim > 512:
                        scale = 512 / max_dim
                        new_w = max(1, int(orig_w * scale))
                        new_h = max(1, int(orig_h * scale))
                        pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                except Exception:
                    pil_img = Image.open(BytesIO(image_data))

                rgb_img = pil_img.convert("RGB")
                cur_w, cur_h = rgb_img.size

                # 1. Normalize for u2netp (320x320, ImageNet mean/std)
                in_resized = rgb_img.resize((320, 320), Image.Resampling.LANCZOS)
                im_ary = np.array(in_resized, dtype=np.float32) / 255.0
                mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
                std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
                norm_tensor = (im_ary - mean) / std
                norm_tensor = np.expand_dims(norm_tensor.transpose((2, 0, 1)), 0).astype(np.float32)

                # 2. Run ONNX inference
                input_name = session.get_inputs()[0].name
                ort_outs = session.run(None, {input_name: norm_tensor})
                pred = ort_outs[0][:, 0, :, :]

                # 3. Min-max normalization of saliency map
                ma = float(np.max(pred))
                mi = float(np.min(pred))
                if ma > mi:
                    pred = (pred - mi) / (ma - mi)
                pred = np.squeeze(pred)

                # 4. Generate alpha mask and resize to image dimensions
                mask = Image.fromarray((pred * 255).astype(np.uint8), mode="L")
                mask = mask.resize((cur_w, cur_h), Image.Resampling.LANCZOS)

                # 5. Composite foreground with transparent background
                empty = Image.new("RGBA", (cur_w, cur_h), (0, 0, 0, 0))
                cutout = Image.composite(rgb_img.convert("RGBA"), empty, mask)

                buf = BytesIO()
                cutout.save(buf, format="PNG")
                gc.collect()
                return buf.getvalue()

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

            gc.collect()

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
        """Convert ARGB bytes to RGBA."""
        return argb_data

    def _bytes_to_rgba_arr(self, rgba_data: bytes, width: int = 512, height: int = 512) -> np.ndarray:
        """Decode image bytes to RGBA numpy array safely bounded in size."""
        try:
            img = Image.open(BytesIO(rgba_data)).convert("RGBA")
            if max(img.size) > 512:
                scale = 512 / max(img.size)
                new_w = max(1, int(img.size[0] * scale))
                new_h = max(1, int(img.size[1] * scale))
                img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
            return np.array(img, dtype=np.uint8)
        except Exception:
            try:
                return np.frombuffer(rgba_data, dtype=np.uint8).reshape((min(height, 512), min(width, 512), 4))
            except Exception:
                return np.zeros((min(height, 512), min(width, 512), 4), dtype=np.uint8)

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
        try:
            import cv2

            binary_mask = (alpha_channel > 0).astype(np.uint8)
            num_labels, labeled_mask, stats, _ = cv2.connectedComponentsWithStats(
                binary_mask, connectivity=8
            )

            # stats[:, cv2.CC_STAT_AREA] has area of each label (label 0 is background)
            if num_labels > 2:  # at least 2 foreground components
                areas = [int(stats[i, cv2.CC_STAT_AREA]) for i in range(1, num_labels)]
                areas.sort(reverse=True)
                main_component_size = areas[0]
                second_size = areas[1]
                if second_size < main_component_size * 0.05:
                    small_holes = sum(
                        1 for s in areas[1:] if s < main_component_size * 0.01
                    )
                    if small_holes > 20:
                        warnings.append(
                            "SUSPICIOUS: Excessive internal holes detected "
                            f"({small_holes} small holes)"
                        )
        except Exception:
            pass

        # Check 5: Nearly empty alpha mask
        if total_pixels > 0 and fg_pixels < max(1, total_pixels * 0.01):
            warnings.append(
                "SUSPICIOUS: Nearly empty alpha mask - "
                "very little foreground detected"
            )

        return warnings