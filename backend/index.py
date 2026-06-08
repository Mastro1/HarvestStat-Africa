"""Vercel Services entrypoint for the Flask backend."""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import app  # noqa: E402
from backend.data_loader import get_dataframe  # noqa: E402

# Warm the in-memory cache during cold start (Vercel free tier: 10s limit).
get_dataframe()
