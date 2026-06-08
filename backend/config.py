import os
from pathlib import Path

DEFAULT_DATA_CSV_URL = (
    "https://raw.githubusercontent.com/HarvestStat/HarvestStat-Africa/"
    "refs/heads/main/public/hvstat_africa_data_v1.2.csv"
)

DEFAULT_STATUS_MAP_URL = (
    "https://raw.githubusercontent.com/HarvestStat/HarvestStat-Africa/"
    "refs/heads/main/docs/current_status_map.png"
)

DATA_CSV_URL = os.environ.get("DATA_CSV_URL", DEFAULT_DATA_CSV_URL)

BACKEND_DIR = Path(__file__).resolve().parent
CACHE_DIR = BACKEND_DIR / ".cache"
CACHE_FILE = CACHE_DIR / "hvstat_africa_data.csv"

# Vercel free tier allows only 10s per function invocation, so runtime must not
# download the ~24 MB CSV. Data is fetched at build time and bundled with the function.
IS_VERCEL = os.environ.get("VERCEL") == "1"
CACHE_ONLY_AT_RUNTIME = IS_VERCEL or os.environ.get(
    "DATA_CACHE_ONLY", ""
).lower() in ("1", "true", "yes")

# How long a cached file is considered fresh before re-fetching at runtime (seconds).
# Ignored on Vercel where data refreshes only on redeploy.
CACHE_TTL_SECONDS = int(os.environ.get("DATA_CACHE_TTL_SECONDS", str(6 * 60 * 60)))
