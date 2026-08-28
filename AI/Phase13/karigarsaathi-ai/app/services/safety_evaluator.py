"""Safety evaluator for enhancement results."""

from __future__ import annotations

from typing import Any

from app.domain.enums import SafetyStatus, ErrorCode


class EnhancementSafetyEvaluator:
    """Evaluates whether enhanced images are safe to return to users."""

    def __init__(self, config: dict[str, any] | None = None):
        """Initialize with configurable thresholds from environment config."""
        self.config = config or {}

        # Conservative defaults (can be overridden via config/env)
        self.mean_delta_e_threshold: float = float(
            self.config.get("MEAN_DELTA_E_THRESHOLD", "3.0")
        )
        self.edge_preservation_threshold: float = float(
            self.config.get("EDGE_PRESERVATION_THRESHOLD", "0.90")
        )
        self.luminance_ssim_threshold: float = float(
            self.config.get("LUMINANCE_SSIM_THRESHOLD", "0.92")
        )
        self.highlight_clipping_threshold: float = float(
            self.config.get("HIGHLIGHT_CLIPPING_THRESHOLD", "1.0")
        )
        self.shadow_clipping_threshold: float = float(
            self.config.get("SHADOW_CLIPPING_THRESHOLD", "2.0")
        )
        self.foreground_coverage_lower: float = float(
            self.config.get("FOREGROUND_COVERAGE_LOWER", "0.05")
        )
        self.foreground_coverage_upper: float = float(
            self.config.get("FOREGROUND_COVERAGE_UPPER", "0.98")
        )

    def evaluate(
        self,
        metrics: dict[str, float | None],
        config: dict[str, any] | None = None,
    ) -> dict[str, any]:
        """Evaluate enhancement safety based on quality metrics.

        Returns dict with:
        - status: SafetyStatus (safe / warning / unsafe)
        - warnings: list of warning strings
        - fallback_to_original: bool
        """
        cfg = config or self.config
        warnings: list[str] = []
        threshold_violations: list[str] = []

        # 1. Mean Delta E check (colour preservation)
        mean_delta_e = metrics.get("mean_delta_e")
        if mean_delta_e is not None:
            if mean_delta_e > self.mean_delta_e_threshold:
                threshold_violations.append(
                    f"mean_delta_e={mean_delta_e:.2f} > {self.mean_delta_e_threshold}"
                )
                warnings.append(
                    f"Colour change detected: mean Delta E {mean_delta_e:.2f} "
                    f"exceeds threshold {self.mean_delta_e_threshold}"
                )

        # 2. Edge preservation check
        edge_preservation = metrics.get("edge_preservation_ratio")
        if edge_preservation is not None:
            if edge_preservation < self.edge_preservation_threshold:
                threshold_violations.append(
                    f"edge_preservation_ratio={edge_preservation:.3f} < "
                    f"{self.edge_preservation_threshold}"
                )
                warnings.append(
                    f"Edge preservation lost: ratio {edge_preservation:.3f} "
                    f"below threshold {self.edge_preservation_threshold}"
                )

        # 3. Luminance SSIM check
        luminance_ssim = metrics.get("luminance_ssim")
        if luminance_ssim is not None:
            if luminance_ssim < self.luminance_ssim_threshold:
                threshold_violations.append(
                    f"luminance_ssim={luminance_ssim:.3f} < "
                    f"{self.luminance_ssim_threshold}"
                )
                warnings.append(
                    f"Luminance distortion: SSIM {luminance_ssim:.3f} "
                    f"below threshold {self.luminance_ssim_threshold}"
                )

        # 4. Highlight clipping check
        highlight_clipping = metrics.get("highlight_clipping_percent")
        if highlight_clipping is not None:
            if highlight_clipping > self.highlight_clipping_threshold:
                threshold_violations.append(
                    f"highlight_clipping={highlight_clipping:.2f}% > "
                    f"{self.highlight_clipping_threshold:.0f}%"
                )
                warnings.append(
                    f"Highlight clipping: {highlight_clipping:.2f}% exceeds "
                    f"{self.highlight_clipping_threshold:.0f}%"
                )

        # 5. Shadow clipping check
        shadow_clipping = metrics.get("shadow_clipping_percent")
        if shadow_clipping is not None:
            if shadow_clipping > self.shadow_clipping_threshold:
                threshold_violations.append(
                    f"shadow_clipping={shadow_clipping:.2f}% > "
                    f"{self.shadow_clipping_threshold:.0f}%"
                )
                warnings.append(
                    f"Shadow clipping: {shadow_clipping:.2f}% exceeds "
                    f"{self.shadow_clipping_threshold:.0f}%"
                )

        # 6. Foreground coverage check
        fg_coverage = metrics.get("foreground_coverage")
        if fg_coverage is not None:
            if fg_coverage < self.foreground_coverage_lower:
                threshold_violations.append(
                    f"foreground_coverage={fg_coverage:.3f} < "
                    f"{self.foreground_coverage_lower}"
                )
                warnings.append(
                    f"Very low foreground coverage: {fg_coverage:.2%}"
                )
            if fg_coverage > self.foreground_coverage_upper:
                threshold_violations.append(
                    f"foreground_coverage={fg_coverage:.3f} > "
                    f"{self.foreground_coverage_upper}"
                )
                warnings.append(
                    f"Very high foreground coverage: {fg_coverage:.2%} - "
                    f"possible background not removed"
                )

        # Determine final status
        if not threshold_violations:
            status = SafetyStatus.SAFE
            fallback_to_original = False
        elif len(threshold_violations) <= 2:
            # Minor warnings - result still reviewable
            status = SafetyStatus.WARNING
            fallback_to_original = False
        else:
            # Multiple serious warnings - must fall back to original
            status = SafetyStatus.UNSAFE
            fallback_to_original = True

        return {
            "status": status,
            "warnings": warnings,
            "fallback_to_original": fallback_to_original,
            "threshold_violations": threshold_violations,
        }