"""Vercel Services entrypoint for the Flask backend."""

import logging

from app import app
from config import CACHE_FILE
from data_loader import download_csv_to_cache, get_dataframe

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
