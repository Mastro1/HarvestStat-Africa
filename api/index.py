import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import app  # noqa: E402  (Vercel expects `app`)
from backend.data_loader import get_dataframe  # noqa: E402

# Warm the in-memory cache during cold start so the first API request stays
# within the Vercel free-tier 10 second function limit.
get_dataframe()
