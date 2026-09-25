"""Vercel Serverless Function entrypoint for KarigarSaathi AI Image Studio."""

import os
import sys

# Ensure app package is discoverable by Vercel serverless runtime
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Redirect storage directories to /tmp in serverless environment
if os.getenv("VERCEL"):
    os.environ.setdefault("ORIGINALS_DIR", "/tmp/storage/originals")
    os.environ.setdefault("ENHANCED_DIR", "/tmp/storage/enhanced")
    os.environ.setdefault("PREVIEWS_DIR", "/tmp/storage/previews")

from app.main import app
