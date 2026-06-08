import logging
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

import pandas as pd

from backend.config import (
    CACHE_FILE,
    CACHE_ONLY_AT_RUNTIME,
    CACHE_TTL_SECONDS,
    DATA_CSV_URL,
)

logger = logging.getLogger(__name__)

CSV_DTYPES = {
    "fnid": "category",
    "country": "category",
    "country_code": "category",
    "admin_1": "category",
    "admin_2": "category",
    "product": "category",
    "season_name": "category",
    "crop_production_system": "category",
    "qc_flag": "int8",
}

NUMERIC_COLS = [
    "planting_year",
    "harvest_year",
    "planting_month",
    "harvest_month",
    "area",
    "production",
    "yield",
]

_dataframe: Optional[pd.DataFrame] = None
_dataframe_loaded_at: Optional[float] = None


def _normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def _read_csv(source) -> pd.DataFrame:
    df = pd.read_csv(source, dtype=CSV_DTYPES)
    return _normalize_dataframe(df)


def _cache_is_fresh() -> bool:
    if not CACHE_FILE.exists():
        return False
    age_seconds = time.time() - CACHE_FILE.stat().st_mtime
    return age_seconds < CACHE_TTL_SECONDS


def download_csv_to_cache(url: str = DATA_CSV_URL, destination=CACHE_FILE) -> Path:
    """Download the official CSV into the local cache (used at build time and runtime refresh)."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Downloading HarvestStat data from %s", url)
    request = urllib.request.Request(url, headers={"User-Agent": "HarvestStat-UI/1.0"})
    with urllib.request.urlopen(request, timeout=180) as response:
        destination.write_bytes(response.read())
    logger.info("Saved HarvestStat data cache to %s", destination)
    return destination


def _load_from_cache_file() -> pd.DataFrame:
    logger.info("Loading HarvestStat data from cache file: %s", CACHE_FILE)
    return _read_csv(CACHE_FILE)


def _load_from_remote_url() -> pd.DataFrame:
    logger.info("Loading HarvestStat data from remote URL: %s", DATA_CSV_URL)
    request = urllib.request.Request(DATA_CSV_URL, headers={"User-Agent": "HarvestStat-UI/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            df = _read_csv(response)
    except urllib.error.URLError as exc:
        logger.error("Failed to fetch remote CSV: %s", exc)
        raise

    try:
        download_csv_to_cache()
    except Exception as exc:
        logger.warning("Could not persist downloaded CSV to cache: %s", exc)

    return df


def load_dataframe(force_reload: bool = False) -> pd.DataFrame:
    """Return the in-memory dataframe, loading from cache or GitHub when needed."""
    global _dataframe, _dataframe_loaded_at

    if _dataframe is not None and not force_reload:
        if CACHE_ONLY_AT_RUNTIME:
            return _dataframe
        if _dataframe_loaded_at is not None and (time.time() - _dataframe_loaded_at) < CACHE_TTL_SECONDS:
            return _dataframe

    started_at = time.time()

    if CACHE_ONLY_AT_RUNTIME:
        if not CACHE_FILE.exists():
            raise FileNotFoundError(
                f"Bundled data cache not found at {CACHE_FILE}. "
                "On Vercel, the CSV must be downloaded during the build step."
            )
        df = _load_from_cache_file()
    elif CACHE_FILE.exists() and _cache_is_fresh():
        df = _load_from_cache_file()
    else:
        try:
            df = _load_from_remote_url()
        except Exception:
            if CACHE_FILE.exists():
                logger.warning("Remote fetch failed; falling back to stale cache file.")
                df = _load_from_cache_file()
            else:
                raise

    _dataframe = df
    _dataframe_loaded_at = time.time()
    logger.info(
        "HarvestStat data ready (%s rows, %.2fs).",
        len(df),
        time.time() - started_at,
    )
    return df


def get_dataframe() -> pd.DataFrame:
    """Lazy accessor used by API routes."""
    try:
        return load_dataframe()
    except Exception as exc:
        logger.error("Unable to load HarvestStat data: %s", exc)
        return pd.DataFrame()
