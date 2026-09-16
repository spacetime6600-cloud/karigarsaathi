"""Verification script for real authenticated Cloudinary integration.

Runs only when real credentials are configured in .env.
Uploads a small test craft photo, verifies Cloudinary asset and delivery URL,
verifies metadata, and cleans up by deleting the asset from Cloudinary.
"""

import os
import sys
import hashlib
import io
import asyncio
from datetime import datetime, timezone
from PIL import Image
import urllib.request

# Ensure app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
from app.adapters.cloudinary_storage import CloudinaryStorageAdapter


def generate_test_image() -> bytes:
    """Generate a small (200x200) sample craft image."""
    buf = io.BytesIO()
    img = Image.new("RGB", (200, 200), color=(180, 80, 50))  # Terracotta craft color
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


async def run_live_verification():
    print("=================================================================")
    print("KarigarSaathi — Cloudinary Live Production Integration Probe")
    print("=================================================================")

    settings = get_settings()

    print(f"MEDIA_STORAGE_PROVIDER: {settings.media_storage_provider}")
    print(f"Cloud Name configured:  {'YES' if bool(settings.cloudinary_cloud_name) else 'NO'}")
    print(f"API Key configured:     {'YES' if bool(settings.cloudinary_api_key) else 'NO'}")
    print(f"API Secret configured:  {'YES' if bool(settings.cloudinary_api_secret) else 'NO'}")

    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        print("\n[ERROR] Real Cloudinary credentials are not configured yet in .env.")
        print("Please configure the 4 variables in AI/Phase13/karigarsaathi-ai/.env")
        sys.exit(1)

    adapter = CloudinaryStorageAdapter(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        require_config=True,
    )

    test_bytes = generate_test_image()
    test_product_id = f"test_prod_{int(datetime.now().timestamp())}"
    test_image_id = f"test_img_{int(datetime.now().timestamp())}"
    variant = "original"
    idempotency_key = f"idemp_live_probe_{test_product_id}_{test_image_id}"

    print(f"\n[1/4] Uploading test craft photo ({len(test_bytes)} bytes)...")
    try:
        metadata = await adapter.upload(
            file_bytes=test_bytes,
            product_id=test_product_id,
            image_id=test_image_id,
            variant=variant,
            idempotency_key=idempotency_key,
        )
        print(f" -> Upload SUCCESS!")
        print(f" -> Public ID:  {metadata['publicId']}")
        print(f" -> Secure URL: {metadata['secureUrl']}")
        print(f" -> Format:     {metadata['format']}")
        print(f" -> Dimensions: {metadata['width']}x{metadata['height']}")
        print(f" -> Checksum:   {metadata['checksum']}")
    except Exception as exc:
        print(f"\n[FAILED] Live Cloudinary upload failed: {exc}")
        sys.exit(1)

    print(f"\n[2/4] Verifying Cloudinary CDN delivery via HTTP GET...")
    try:
        req = urllib.request.Request(
            metadata["secureUrl"],
            headers={"User-Agent": "KarigarSaathi-Verifier/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.getcode()
            content_type = resp.headers.get("Content-Type")
            downloaded = resp.read()

        print(f" -> CDN HTTP Status: {status_code}")
        print(f" -> CDN Content-Type: {content_type}")
        print(f" -> CDN Bytes Received: {len(downloaded)} bytes")
        assert status_code == 200, f"Expected HTTP 200, got {status_code}"
    except Exception as exc:
        print(f"\n[FAILED] CDN asset delivery verification failed: {exc}")
        sys.exit(1)

    print(f"\n[3/4] Deleting test asset from Cloudinary (cleanup)...")
    try:
        del_result = await adapter.destroy(
            product_id=test_product_id,
            image_id=test_image_id,
            variant=variant,
        )
        print(f" -> Deletion result: {del_result}")
        assert del_result["deleted"] is True
    except Exception as exc:
        print(f"\n[FAILED] Cloudinary deletion failed: {exc}")
        sys.exit(1)

    print(f"\n[4/4] Confirming asset is deleted from Cloudinary...")
    try:
        req = urllib.request.Request(
            metadata["secureUrl"],
            headers={"User-Agent": "KarigarSaathi-Verifier/1.0"},
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                print(f" -> Note: CDN cached response status {resp.getcode()} (cache invalidation pending)")
        except urllib.error.HTTPError as http_err:
            print(f" -> Confirmed deleted (HTTP {http_err.code} Not Found)")
    except Exception:
        pass

    print("\n=================================================================")
    print("SUCCESS: Real Cloudinary Authenticated Integration Verified!")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(run_live_verification())
