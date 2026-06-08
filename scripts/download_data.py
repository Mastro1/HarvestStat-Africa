#!/usr/bin/env python3
"""Download the official HarvestStat CSV before deployment builds."""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import DATA_CSV_URL
from backend.data_loader import download_csv_to_cache


MIN_CACHE_BYTES = 1_000_000


def main() -> int:
    print(f"Fetching HarvestStat data from:\n  {DATA_CSV_URL}")
    try:
        cache_path = download_csv_to_cache()
    except Exception as exc:
        print(f"ERROR: Failed to download HarvestStat data: {exc}", file=sys.stderr)
        return 1

    size_bytes = cache_path.stat().st_size
    if size_bytes < MIN_CACHE_BYTES:
        print(
            f"ERROR: Downloaded cache looks too small ({size_bytes} bytes).",
            file=sys.stderr,
        )
        return 1

    print(f"Cached to: {cache_path} ({size_bytes / 1024 / 1024:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
