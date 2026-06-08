import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import DATA_CSV_URL
from backend.data_loader import get_dataframe

try:
    print(f"Loading CSV from official source:\n  {DATA_CSV_URL}")
    data = get_dataframe()
    print(f"CSV loaded successfully. Shape: {data.shape}")
    print(f"Columns: {data.columns.tolist()}")

    if "country" in data.columns:
        unique_countries = data["country"].dropna().unique()
        print(f"Number of unique countries: {len(unique_countries)}")
        print(f"Unique countries: {sorted(unique_countries.tolist())}")
    else:
        print("No 'country' column found!")
        print("Available columns:", data.columns.tolist())

except Exception as exc:
    print(f"Error loading CSV: {exc}")
