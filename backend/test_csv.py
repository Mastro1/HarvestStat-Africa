import pandas as pd

try:
    print("Loading CSV...")
    data = pd.read_csv('../public/hvstat_africa_data_v1.0.csv')
    print(f"CSV loaded successfully. Shape: {data.shape}")
    print(f"Columns: {data.columns.tolist()}")
    
    if 'Country' in data.columns:
        print(f"Country column found!")
        print(f"First 5 Country values: {data['Country'].head().tolist()}")
        unique_countries = data['Country'].dropna().unique()
        print(f"Number of unique countries: {len(unique_countries)}")
        print(f"Unique countries: {sorted(unique_countries.tolist())}")
    else:
        print("No 'Country' column found!")
        print("Available columns:", data.columns.tolist())
        
except Exception as e:
    print(f"Error loading CSV: {e}") 