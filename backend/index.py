"""Vercel Services entrypoint for the Flask backend."""

import logging
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import app  # noqa: E402
from backend.config import CACHE_FILE  # noqa: E402
from backend.data_loader import download_csv_to_cache, get_dataframe  # noqa: E402

logger = logging.getLogger(__name__)

if not CACHE_FILE.exists():
    try:
        download_csv_to_cache()
    except Exception as exc:
        logger.error("Dataset cache missing and startup download failed: %s", exc)

try:
    get_dataframe()
except Exception as exc:
    # Do not crash the serverless function on import; API routes return errors instead.
    logger.error("Failed to warm in-memory dataset cache: %s", exc)
