"""Quality metrics calculation using scikit-image and NumPy."""

from __future__ import annotations

import numpy as np

from app.domain.enums import ErrorCode


from io import BytesIO
from PIL import Image

def _ensure_rgba(data: bytes, width: int, height: int, max_eval_dim: int = 512) -> np.ndarray:
    """Convert bytes to RGBA numpy array, bounding evaluation resolution to max_eval_dim to avoid memory spikes."""
    try:
        img = Image.open(BytesIO(data)).convert("RGBA")
        cur_w, cur_h = img.size
        m = max(cur_w, cur_h)
        if m > max_eval_dim:
            scale = max_eval_dim / m
            tw = max(1, int(cur_w * scale))
            th = max(1, int(cur_h * scale))
        else:
            tw, th = cur_w, cur_h

        if img.size != (tw, th):
            img = img.resize((tw, th), Image.Resampling.BILINEAR)
        return np.array(img, dtype=np.uint8)
    except Exception:
        try:
            return np.frombuffer(data, dtype=np.uint8).reshape((min(height, max_eval_dim), min(width, max_eval_dim), 4))
        except Exception:
            return np.zeros((min(height, max_eval_dim), min(width, max_eval_dim), 4), dtype=np.uint8)


def _calculate_ciede2000(
    original: np.ndarray, enhanced: np.ndarray
) -> float:
    """Calculate mean CIEDE2000 colour difference between two RGBA arrays.

    Note: Full CIEDE2000 is complex; we use a simplified Delta E approximation
    on the RGB channels for this prototype.
    """
    if original.shape != enhanced.shape:
        raise ValueError("Arrays must have the same shape")

    # Convert RGB to approximate Lab for better colour difference
    orig_rgb = original[..., :3].astype(np.float32) / 255.0
    enh_rgb = enhanced[..., :3].astype(np.float32) / 255.0

    # Simplified Delta E (CIE76) - mean per-pixel distance
    delta_e = np.sqrt(
        np.sum((orig_rgb - enh_rgb) ** 2, axis=-1)
    )
    return float(np.mean(delta_e))


def calculate_metrics(
    original_rgba: bytes,
    enhanced_rgba: bytes,
    original_alpha: bytes,
    enhanced_alpha: bytes,
    original_width: int,
    original_height: int,
) -> dict[str, float | None]:
    """Calculate quality metrics comparing original and enhanced images.

    Returns dict with metrics or None when calculation is not possible.
    """
    default_metrics: dict[str, float | None] = {
        "mean_delta_e": None,
        "p95_delta_e": None,
        "luminance_ssim": None,
        "edge_preservation_ratio": None,
        "foreground_coverage": None,
        "highlight_clipping_percent": None,
        "shadow_clipping_percent": None,
        "mask_boundary_retention": None,
    }

    try:
        orig_arr = _ensure_rgba(original_rgba, original_width, original_height)
        enh_arr = _ensure_rgba(enhanced_rgba, original_width, original_height)

        # Align spatial dimensions to original for direct array comparisons
        if orig_arr.shape[:2] != enh_arr.shape[:2]:
            img_enh = Image.fromarray(enh_arr)
            img_enh_resized = img_enh.resize((orig_arr.shape[1], orig_arr.shape[0]), Image.Resampling.BILINEAR)
            enh_arr = np.array(img_enh_resized, dtype=np.uint8)
    except Exception:
        return default_metrics

    # Mean Delta E (approximate)
    try:
        mean_delta_e = _calculate_ciede2000(orig_arr, enh_arr)
    except Exception:
        mean_delta_e = None

    # 95th percentile Delta E
    try:
        p95_delta_e = float(np.percentile(
            _calculate_per_pixel_delta_e(orig_arr, enh_arr), 95
        ))
    except Exception:
        p95_delta_e = None

    # Luminance SSIM - work in LAB space
    try:
        from skimage.metrics import structural_similarity as ssim
        from skimage.transform import resize

        orig_lab = _rgb_to_lab(orig_arr)
        enh_lab = _rgb_to_lab(enh_arr)
        # Use only luminance channel (L)
        orig_l = orig_lab[..., 0]
        enh_l = enh_lab[..., 0]
        # Resize if needed for SSIM (must be same size)
        if orig_l.shape != enh_l.shape:
            enh_l = resize(enh_l, orig_l.shape, anti_aliasing=False)
        luminance_ssim_val = ssim(orig_l, enh_l, data_range=100.0)
        luminance_ssim = float(luminance_ssim_val)
    except Exception:
        luminance_ssim = None

    # Edge preservation ratio: compare gradients
    try:
        edge_preservation_ratio = _calculate_edge_preservation(
            orig_arr, enh_arr
        )
    except Exception:
        edge_preservation_ratio = None

    orig_alpha = orig_arr[..., 3]
    enh_alpha = enh_arr[..., 3]

    # Foreground coverage (ratio of non-transparent pixels)
    try:
        enh_fg_pixels = np.sum(enh_alpha > 0)
        total_pixels = enh_alpha.size
        foreground_coverage = float(enh_fg_pixels / total_pixels) if total_pixels > 0 else None
    except Exception:
        foreground_coverage = None

    # Highlight clipping percentage (pixels with R=G=B=255 in enhanced)
    try:
        highlight_mask = (enh_arr[..., :3] == 255).all(axis=-1)
        highlight_clipping_percent = float(
            np.sum(highlight_mask & (enh_alpha > 0)) / enh_alpha.size * 100
        ) if enh_alpha.size > 0 else None
    except Exception:
        highlight_clipping_percent = None

    # Shadow clipping percentage (pixels near black)
    try:
        shadow_mask = (enh_arr[..., :3] == 0).all(axis=-1)
        shadow_clipping_percent = float(
            np.sum(shadow_mask & (enh_alpha > 0)) / enh_alpha.size * 100
        ) if enh_alpha.size > 0 else None
    except Exception:
        shadow_clipping_percent = None

    # Mask boundary retention: how well alpha boundary matches
    try:
        mask_boundary_retention = _calculate_mask_boundary_retention(
            orig_alpha, enh_alpha
        )
    except Exception:
        mask_boundary_retention = None

    import gc
    gc.collect()

    return {
        "mean_delta_e": mean_delta_e if (mean_delta_e is not None and not np.isnan(mean_delta_e)) else None,
        "p95_delta_e": p95_delta_e if (p95_delta_e is not None and not np.isnan(p95_delta_e)) else None,
        "luminance_ssim": luminance_ssim,
        "edge_preservation_ratio": edge_preservation_ratio,
        "foreground_coverage": foreground_coverage,
        "highlight_clipping_percent": highlight_clipping_percent,
        "shadow_clipping_percent": shadow_clipping_percent,
        "mask_boundary_retention": mask_boundary_retention,
    }


def _calculate_per_pixel_delta_e(
    original: np.ndarray, enhanced: np.ndarray
) -> np.ndarray:
    """Calculate per-pixel Delta E approximation using float32 to conserve RAM."""
    orig_rgb = original[..., :3].astype(np.float32) / 255.0
    enh_rgb = enhanced[..., :3].astype(np.float32) / 255.0
    return np.sqrt(np.sum((orig_rgb - enh_rgb) ** 2, axis=-1))


def _rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """Convert RGB numpy array to LAB colour space.

    Uses a simple matrix transformation for prototype purposes.
    """
    # Normalize to 0-1
    rgb_norm = rgb / 255.0

    # sRGB to XYD65 matrix (approximate)
    # D65 white point
    x = rgb_norm[..., 0] * 0.4124 + rgb_norm[..., 1] * 0.3576 + rgb_norm[..., 2] * 0.1805
    y = rgb_norm[..., 0] * 0.2126 + rgb_norm[..., 1] * 0.7152 + rgb_norm[..., 2] * 0.0722
    z = rgb_norm[..., 0] * 0.0193 + rgb_norm[..., 1] * 0.1192 + rgb_norm[..., 2] * 0.9505

    # Avoid log(0)
    x = np.where(x > 0, x, 1e-8)
    y = np.where(y > 0, y, 1e-8)
    z = np.where(z > 0, z, 1e-8)

    # Reference white D65
    xyz_ref = np.array([0.9505, 1.0, 1.0890])
    xr = x / xyz_ref[0]
    yr = y / xyz_ref[1]
    zr = z / xyz_ref[2]

    # Apply cube root or power approximation
    def cbrt(x): return x ** (1/3) if x > 1e-3 else 7.787 * x + 16 / 116

    cx = cbrt(xr)
    cy = cbrt(yr)
    cz = cbrt(zr)

    # Lab L*a*b*
    l = 116 * cy - 16
    a = 500 * (cx - cy)
    b = 200 * (cy - cz)

    # Clip L to 0-100 range
    l = np.clip(l, 0, 100)
    return np.stack([l, a, b], axis=-1)


def _calculate_edge_preservation(
    original: np.ndarray, enhanced: np.ndarray
) -> float | None:
    """Calculate edge preservation ratio.

    Compares gradient magnitude original vs enhanced.
    Returns ratio of enhanced gradient to original gradient.
    """
    try:
        # Convert to grayscale for gradient calculation
        orig_gray = np.mean(original[..., :3], axis=-1)
        enh_gray = np.mean(enhanced[..., :3], axis=-1)

        # Sobel gradients
        from scipy import ndimage

        orig_dx = ndimage.sobel(orig_gray, axis=1)
        orig_dy = ndimage.sobel(orig_gray, axis=0)
        orig_gradient = np.sqrt(orig_dx ** 2 + orig_dy ** 2)

        enh_dx = ndimage.sobel(enh_gray, axis=1)
        enh_dy = ndimage.sobel(enh_gray, axis=0)
        enh_gradient = np.sqrt(enh_dx ** 2 + enh_dy ** 2)

        # Avoid division by zero
        with np.errstate(divide='ignore', invalid='ignore'):
            ratio = np.where(
                orig_gradient > 0,
                enh_gradient / orig_gradient,
                0.0
            )

        # Mean ratio, ignoring NaN
        valid_ratio = ratio[~np.isnan(ratio)]
        if valid_ratio.size > 0:
            return float(np.mean(valid_ratio))
        return 0.0
    except Exception:
        return None


def _calculate_mask_boundary_retention(
    original_alpha: np.ndarray, enhanced_alpha: np.ndarray
) -> float | None:
    """Calculate how well the enhanced mask retains the original boundary.

    Returns 0.0-1.0 where 1.0 means perfect boundary retention.
    """
    try:
        # Find boundary pixels (pixels where alpha changes from 0 to >0 or vice versa)
        orig_boundary = _find_alpha_boundary(original_alpha)
        enh_boundary = _find_alpha_boundary(enhanced_alpha)

        if len(orig_boundary) == 0:
            return 1.0  # No boundary in original, nothing to lose

        # Check how many original boundary pixels are preserved in enhanced
        # A boundary pixel is "retained" if it's still near a boundary in enhanced
        retention_count = 0
        total_orig_boundary = len(orig_boundary)

        for px, py in orig_boundary:
            # Check neighbourhood in enhanced
            x, y = px, py
            # Check 3x3 neighbourhood
            neighbours = []
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < enhanced_alpha.shape[1] and 0 <= ny < enhanced_alpha.shape[0]:
                        neighbours.append(enhanced_alpha[ny, nx] > 0)
                    else:
                        neighbours.append(False)

            # If at least 5 of 8 neighbours (excluding center) are foreground,
            # consider the boundary retained
            if sum(neighbours) >= 5:
                retention_count += 1

        if total_orig_boundary > 0:
            return float(retention_count / total_orig_boundary)
        return 1.0
    except Exception:
        return None


def _find_alpha_boundary(alpha: np.ndarray) -> list[tuple[int, int]]:
    """Find boundary pixels in an alpha mask.

    A boundary pixel is one where at least one 4-connected neighbour
    has a different alpha value.
    """
    boundary = []
    h, w = alpha.shape

    for y in range(h):
        for x in range(w):
            current = alpha[y, x]
            # Check 4-connected neighbours
            neighbours = []
            if y > 0:
                neighbours.append(alpha[y - 1, x])
            if y < h - 1:
                neighbours.append(alpha[y + 1, x])
            if x > 0:
                neighbours.append(alpha[y, x - 1])
            if x < w - 1:
                neighbours.append(alpha[y, x + 1])

            # Boundary if current differs from any neighbour
            if any(n != current for n in neighbours):
                boundary.append((y, x))

    return boundary