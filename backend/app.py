import pandas as pd
from flask import Flask, jsonify, request
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load the CSV data
try:
    data = pd.read_csv('public/hvstat_africa_data_v1.0.csv')
    # Convert relevant columns to numeric, coercing errors to NaN
    numeric_cols = ['Year', 'Planting Year', 'Harvest Year', 'Area Planted (ha)', 'Area Harvested (ha)', 'Production (t)', 'Yield (t/ha)']
    for col in numeric_cols:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors='coerce')
    logging.info("CSV data loaded and processed successfully.")
except FileNotFoundError:
    logging.error("FATAL: The CSV file 'public/hvstat_africa_data_v1.0.csv' was not found.")
    data = pd.DataFrame() # Create an empty DataFrame to prevent further errors
except Exception as e:
    logging.error(f"FATAL: An unexpected error occurred during CSV loading: {e}")
    data = pd.DataFrame()


app = Flask(__name__)

def get_missing_years(years_series):
    if years_series.empty or years_series.isnull().all():
        return []
    min_year = int(years_series.min())
    max_year = int(years_series.max())
    if min_year == max_year: # Avoid issues with range if only one year
        return []
    present_years = set(years_series.dropna().astype(int))
    expected_years = set(range(min_year, max_year + 1))
    return sorted(list(expected_years - present_years))

def calculate_crop_details(df_crop, total_country_production_for_crop):
    crop_production = df_crop['Production (t)'].sum()
    crop_area = df_crop['Area Harvested (ha)'].sum()
    crop_yield = crop_production / crop_area if crop_area else 0

    seasons_data = []
    if 'Season Name' in df_crop.columns:
        for season_name, df_season in df_crop.groupby('Season Name'):
            season_production = df_season['Production (t)'].sum()
            season_area = df_season['Area Harvested (ha)'].sum()
            season_yield = season_production / season_area if season_area else 0
            production_systems = df_season['Production System'].unique().tolist() if 'Production System' in df_season.columns else []

            planting_months = []
            if 'Planting Month' in df_season.columns:
                planting_months = sorted(df_season['Planting Month'].dropna().unique().tolist())

            harvest_months = []
            if 'Harvest Month' in df_season.columns:
                harvest_months = sorted(df_season['Harvest Month'].dropna().unique().tolist())

            seasons_data.append({
                'season_name': season_name,
                'production_absolute': season_production,
                'production_percentage_of_crop': (season_production / crop_production * 100) if crop_production else 0,
                'area_harvested': season_area,
                'yield': season_yield,
                'production_systems': production_systems,
                'planting_months': planting_months,
                'harvest_months': harvest_months,
            })

    return {
        'total_production': crop_production,
        'total_area_harvested': crop_area,
        'average_yield': crop_yield,
        'season_specific_breakdown': seasons_data,
    }


@app.route('/api/countries')
def get_countries():
    app.logger.info(f"Request received for /api/countries from {request.remote_addr}")
    if not data.empty and 'Country' in data.columns:
        unique_countries = sorted(data['Country'].dropna().unique().tolist())
        app.logger.info(f"Found {len(unique_countries)} countries. Returning list.")
        return jsonify(unique_countries)
    app.logger.warning("Country data is empty or 'Country' column missing. Returning empty list.")
    return jsonify([])

@app.route('/api/data')
def get_data():
    app.logger.info(f"Request received for /api/data from {request.remote_addr} with args: {request.args}")
    country = request.args.get('country')
    admin_level_str = request.args.get('admin_level')

    if not country:
        app.logger.warning("Missing 'country' parameter in /api/data request.")
        return jsonify({"error": "Country parameter is required"}), 400
    if not admin_level_str:
        app.logger.warning("Missing 'admin_level' parameter in /api/data request.")
        return jsonify({"error": "admin_level parameter is required"}), 400

    try:
        admin_level = int(admin_level_str)
    except ValueError:
        app.logger.warning(f"Invalid 'admin_level' parameter: {admin_level_str}. Must be integer.")
        return jsonify({"error": "admin_level must be an integer (0, 1, or 2)"}), 400

    if admin_level not in [0, 1, 2]:
        app.logger.warning(f"Invalid 'admin_level' value: {admin_level}. Must be 0, 1, or 2.")
        return jsonify({"error": "admin_level must be 0, 1, or 2"}), 400

    if data.empty:
        app.logger.error("Data not loaded, cannot serve /api/data request.")
        return jsonify({"error": "Data not loaded or CSV processing failed on server."}), 500

    # Filter by country
    country_data = data[data['Country'] == country].copy()
    if country_data.empty:
        app.logger.info(f"No data found for country: {country}")
        return jsonify({"error": f"No data found for country: {country}"}), 404

    response_data = {
        "country": country,
        "admin_level": admin_level,
    }
    app.logger.info(f"Processing data for Country: {country}, Admin Level: {admin_level}")

    if admin_level == 0: # National level
        response_data['unique_crops_count'] = country_data['Crop'].nunique() if 'Crop' in country_data else 0
        response_data['total_national_production'] = country_data['Production (t)'].sum() if 'Production (t)' in country_data else 0
        response_data['unique_admin_1_units_count'] = country_data['Admin 1'].nunique() if 'Admin 1' in country_data else 0

        planting_years = country_data['Planting Year'].dropna() if 'Planting Year' in country_data else pd.Series(dtype='float64')
        response_data['min_planting_year'] = int(planting_years.min()) if not planting_years.empty else None
        response_data['max_planting_year'] = int(planting_years.max()) if not planting_years.empty else None
        response_data['missing_planting_years'] = get_missing_years(planting_years)

        crops_summary = {}
        if 'Crop' in country_data.columns:
            # Check if total_national_production is NaN (e.g. if all productions are NaN)
            total_prod_for_calc = response_data['total_national_production']
            if pd.isna(total_prod_for_calc): total_prod_for_calc = 0

            for crop_name, df_crop in country_data.groupby('Crop'):
                crops_summary[crop_name] = calculate_crop_details(df_crop, total_prod_for_calc)
        response_data['crops_summary'] = crops_summary

    elif admin_level == 1: # Admin 1 level
        admin_1_name = request.args.get('admin_1_name')
        if not admin_1_name:
            app.logger.warning("Missing 'admin_1_name' for admin_level 1.")
            return jsonify({"error": "admin_1_name parameter is required for admin_level 1"}), 400

        admin_1_data = country_data[country_data['Admin 1'] == admin_1_name].copy()
        if admin_1_data.empty:
            app.logger.info(f"No data for Admin 1: {admin_1_name} in {country}")
            return jsonify({"error": f"No data found for Admin 1: {admin_1_name} in {country}"}), 404

        app.logger.info(f"Processing Admin-1 level data for {admin_1_name}")
        response_data['admin_1_name'] = admin_1_name
        response_data['unique_crops_count'] = admin_1_data['Crop'].nunique() if 'Crop' in admin_1_data else 0
        response_data['total_admin_1_production'] = admin_1_data['Production (t)'].sum() if 'Production (t)' in admin_1_data else 0
        response_data['unique_admin_2_units_count'] = admin_1_data['Admin 2'].nunique() if 'Admin 2' in admin_1_data else 0

        planting_years = admin_1_data['Planting Year'].dropna() if 'Planting Year' in admin_1_data else pd.Series(dtype='float64')
        response_data['min_planting_year'] = int(planting_years.min()) if not planting_years.empty else None
        response_data['max_planting_year'] = int(planting_years.max()) if not planting_years.empty else None
        response_data['missing_planting_years'] = get_missing_years(planting_years)

        crops_summary = {}
        if 'Crop' in admin_1_data.columns:
            total_prod_for_calc = response_data['total_admin_1_production']
            if pd.isna(total_prod_for_calc): total_prod_for_calc = 0
            for crop_name, df_crop in admin_1_data.groupby('Crop'):
                crops_summary[crop_name] = calculate_crop_details(df_crop, total_prod_for_calc)
        response_data['crops_summary'] = crops_summary

    elif admin_level == 2: # Admin 2 level
        admin_1_name = request.args.get('admin_1_name')
        admin_2_name = request.args.get('admin_2_name')
        if not admin_1_name:
            app.logger.warning("Missing 'admin_1_name' for admin_level 2.")
            return jsonify({"error": "admin_1_name parameter is required for admin_level 2"}), 400
        if not admin_2_name:
            app.logger.warning("Missing 'admin_2_name' for admin_level 2.")
            return jsonify({"error": "admin_2_name parameter is required for admin_level 2"}), 400

        admin_2_data = country_data[
            (country_data['Admin 1'] == admin_1_name) & (country_data['Admin 2'] == admin_2_name)
        ].copy()

        if admin_2_data.empty:
            app.logger.info(f"No data for Admin 2: {admin_2_name} in Admin 1: {admin_1_name}, Country: {country}")
            return jsonify({"error": f"No data found for Admin 2: {admin_2_name} in Admin 1: {admin_1_name}, Country: {country}"}), 404

        app.logger.info(f"Processing Admin-2 level data for {admin_2_name} in {admin_1_name}")
        response_data['admin_1_name'] = admin_1_name
        response_data['admin_2_name'] = admin_2_name
        response_data['unique_crops_count'] = admin_2_data['Crop'].nunique() if 'Crop' in admin_2_data else 0
        response_data['total_admin_2_production'] = admin_2_data['Production (t)'].sum() if 'Production (t)' in admin_2_data else 0

        planting_years = admin_2_data['Planting Year'].dropna() if 'Planting Year' in admin_2_data else pd.Series(dtype='float64')
        response_data['min_planting_year'] = int(planting_years.min()) if not planting_years.empty else None
        response_data['max_planting_year'] = int(planting_years.max()) if not planting_years.empty else None
        response_data['missing_planting_years'] = get_missing_years(planting_years)

        crops_summary = {}
        if 'Crop' in admin_2_data.columns:
            total_prod_for_calc = response_data['total_admin_2_production']
            if pd.isna(total_prod_for_calc): total_prod_for_calc = 0
            for crop_name, df_crop in admin_2_data.groupby('Crop'):
                crops_summary[crop_name] = calculate_crop_details(df_crop, total_prod_for_calc)
        response_data['crops_summary'] = crops_summary

    app.logger.info(f"Successfully processed /api/data request. Returning data for {country}, Level {admin_level}.")
    return jsonify(response_data)

if __name__ == '__main__':
    # Make sure to set debug=False for production environments
    app.run(debug=True) # Set debug=False in a production environment
