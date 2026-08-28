"""Create sample manifest for AI Image Studio evaluation dataset."""

from __future__ import annotations

import csv
import os
import uuid
from typing import Any, List, Optional


def create_sample_manifest(
    evaluation_folder: str = "evaluation",
    output_file: str = "evaluation/manifest.csv",
    num_samples: int = 20,
) -> str:
    """Create a sample manifest CSV for evaluation purposes.

    Generates synthetic sample records with consent documentation.
    Used when actual artisan photographs are not yet available.

    Args:
        evaluation_folder: Folder to store sample images in
        output_file: Path for output manifest CSV
        num_samples: Number of synthetic samples to generate

    Returns:
        Path to generated manifest CSV
    """
    # Ensure evaluation directory exists
    os.makedirs(evaluation_folder, exist_ok=True)

    # Categories for diverse product types
    categories = [
        "Textile",
        "Reflective",
        "Intricate_Edges",
        "Poor_Lighting",
        "Cluttered_Background",
    ]

    product_types = {
        "Textile": "Textile",
        "Reflective": "Jewellery",
        "Intricate_Edges": "Textile",
        "Poor_Lighting": "Textile",
        "Cluttered_Background": "Textile",
    }

    # Generate sample records
    records: List[Dict[str, Any]] = []

    for i in range(num_samples):
        sample_id = str(uuid.uuid4())
        category = categories[i % len(categories)]
        product_type = product_types.get(category, "Other")

        # Generate filename
        filename = f"sample-{category.lower().replace('_', '-')}-{i+1:03d}.jpg"
        rel_path = f"samples/{filename}"
        full_path = os.path.join(evaluation_folder, rel_path)

        # Create a simple placeholder image
        from PIL import Image
        img = Image.new("RGB", (400, 300), color=(128, 128, 128))
        img.save(full_path, format="JPEG")

        # Create consent file
        consent_path = full_path.rsplit(".", 1)[0] + ".consent.txt"
        with open(consent_path, "w") as f:
            f.write("true")  # Consent granted

        # Determine artisan ID
        artisan_id = f"artisan-{i % 5 + 1:03d}"

        record = {
            "sample_id": sample_id,
            "category": category,
            "file_path": rel_path,
            "consent_granted": "true",
            "artisan_id": artisan_id,
            "product_type": product_type,
            "before_manual_review": "pending",
            "after_manual_review": "pending",
            "rejection_reason": "",
            "processing_status": "queued",
            "processing_time_ms": 0,
            "metrics_json": "{}",
            "warnings_json": "[]",
            "original_checksum_sha256": "",
            "enhanced_checksum_sha256": "",
        }
        records.append(record)

    # Write CSV manifest
    fieldnames = [
        "sample_id",
        "category",
        "file_path",
        "consent_granted",
        "artisan_id",
        "product_type",
        "before_manual_review",
        "after_manual_review",
        "rejection_reason",
        "processing_status",
        "processing_time_ms",
        "metrics_json",
        "warnings_json",
        "original_checksum_sha256",
        "enhanced_checksum_sha256",
    ]

    manifest_path = os.path.abspath(output_file)
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(record)

    print(f"Generated sample manifest: {manifest_path}")
    print(f"Generated {num_samples} sample images in {evaluation_folder}")

    return manifest_path


if __name__ == "__main__":
    manifest = create_sample_manifest()
    print(f"\nManifest ready at: {manifest}")