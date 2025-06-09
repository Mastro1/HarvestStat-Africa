import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load the CSV data
try:
    data = pd.read_csv('../public/hvstat_africa_data_v1.0.csv')
    # Convert relevant columns to numeric, coercing errors to NaN
    numeric_cols = ['planting_year', 'harvest_year', 'area', 'production', 'yield']
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
CORS(app)  # Enable CORS for all routes

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

def calculate_crop_details(df_crop, total_country_production_for_crop, timeseries_admin_level=0, split_by_season_production_system=False):
    crop_production = df_crop['production'].sum()
    crop_area = df_crop['area'].sum()
    crop_yield = crop_production / crop_area if crop_area else 0

    # Calculate time series data by harvest year and admin level
    time_series_data = []
    if 'harvest_year' in df_crop.columns:
        if timeseries_admin_level == 0:
            if split_by_season_production_system:
                # Split by season and production system combination
                group_columns = []
                if 'season_name' in df_crop.columns:
                    group_columns.append('season_name')
                if 'crop_production_system' in df_crop.columns:
                    group_columns.append('crop_production_system')
                
                if group_columns:
                    for group_values, group_df in df_crop.groupby(group_columns):
                        # Handle both single values and tuples
                        if isinstance(group_values, tuple):
                            if any(pd.isna(val) for val in group_values):
                                continue
                        else:
                            if pd.isna(group_values):
                                continue
                            
                        yearly_data = group_df.groupby('harvest_year').agg({
                            'production': 'sum',
                            'area': 'sum'
                        }).reset_index()
                        
                        series_data = []
                        for _, row in yearly_data.iterrows():
                            year = int(row['harvest_year']) if not pd.isna(row['harvest_year']) else None
                            production = row['production'] if not pd.isna(row['production']) else 0
                            area = row['area'] if not pd.isna(row['area']) else 0
                            yield_value = production / area if area > 0 else 0
                            
                            if year is not None:
                                series_data.append({
                                    'year': year,
                                    'production': production,
                                    'area': area,
                                    'yield': yield_value
                                })
                        
                        if series_data:
                            # Create descriptive label for the series
                            if len(group_columns) == 2:
                                if isinstance(group_values, tuple):
                                    season_name, production_system = group_values
                                else:
                                    season_name, production_system = group_values, 'Unknown'
                                series_label = f"{season_name} - {production_system}"
                            else:
                                series_label = str(group_values)
                            
                            time_series_data.append({
                                'admin_unit': series_label,
                                'data': sorted(series_data, key=lambda x: x['year'])
                            })
                else:
                    # Fallback to single aggregated if no group columns available
                    yearly_data = df_crop.groupby('harvest_year').agg({
                        'production': 'sum',
                        'area': 'sum'
                    }).reset_index()
                    
                    series_data = []
                    for _, row in yearly_data.iterrows():
                        year = int(row['harvest_year']) if not pd.isna(row['harvest_year']) else None
                        production = row['production'] if not pd.isna(row['production']) else 0
                        area = row['area'] if not pd.isna(row['area']) else 0
                        yield_value = production / area if area > 0 else 0
                        
                        if year is not None:
                            series_data.append({
                                'year': year,
                                'production': production,
                                'area': area,
                                'yield': yield_value
                            })
                    
                    time_series_data = [{
                        'admin_unit': 'Total',
                        'data': sorted(series_data, key=lambda x: x['year'])
                    }]
            else:
                # Single aggregated time series
                yearly_data = df_crop.groupby('harvest_year').agg({
                    'production': 'sum',
                    'area': 'sum'
                }).reset_index()
                
                series_data = []
                for _, row in yearly_data.iterrows():
                    year = int(row['harvest_year']) if not pd.isna(row['harvest_year']) else None
                    production = row['production'] if not pd.isna(row['production']) else 0
                    area = row['area'] if not pd.isna(row['area']) else 0
                    yield_value = production / area if area > 0 else 0
                    
                    if year is not None:
                        series_data.append({
                            'year': year,
                            'production': production,
                            'area': area,
                            'yield': yield_value
                        })
                
                time_series_data = [{
                    'admin_unit': 'Total',
                    'data': sorted(series_data, key=lambda x: x['year'])
                }]
            
        elif timeseries_admin_level == 1 and 'admin_1' in df_crop.columns:
            # Group by admin_1 units
            for admin_1_name, admin_df in df_crop.groupby('admin_1'):
                if pd.isna(admin_1_name):
                    continue
                    
                yearly_data = admin_df.groupby('harvest_year').agg({
                    'production': 'sum',
                    'area': 'sum'
                }).reset_index()
                
                series_data = []
                for _, row in yearly_data.iterrows():
                    year = int(row['harvest_year']) if not pd.isna(row['harvest_year']) else None
                    production = row['production'] if not pd.isna(row['production']) else 0
                    area = row['area'] if not pd.isna(row['area']) else 0
                    yield_value = production / area if area > 0 else 0
                    
                    if year is not None:
                        series_data.append({
                            'year': year,
                            'production': production,
                            'area': area,
                            'yield': yield_value
                        })
                
                if series_data:  # Only add if there's data
                    time_series_data.append({
                        'admin_unit': str(admin_1_name),
                        'data': sorted(series_data, key=lambda x: x['year'])
                    })
                    
        elif timeseries_admin_level == 2 and 'admin_2' in df_crop.columns:
            # Group by admin_2 units
            for admin_2_name, admin_df in df_crop.groupby('admin_2'):
                if pd.isna(admin_2_name):
                    continue
                    
                yearly_data = admin_df.groupby('harvest_year').agg({
                    'production': 'sum',
                    'area': 'sum'
                }).reset_index()
                
                series_data = []
                for _, row in yearly_data.iterrows():
                    year = int(row['harvest_year']) if not pd.isna(row['harvest_year']) else None
                    production = row['production'] if not pd.isna(row['production']) else 0
                    area = row['area'] if not pd.isna(row['area']) else 0
                    yield_value = production / area if area > 0 else 0
                    
                    if year is not None:
                        series_data.append({
                            'year': year,
                            'production': production,
                            'area': area,
                            'yield': yield_value
                        })
                
                if series_data:  # Only add if there's data
                    time_series_data.append({
                        'admin_unit': str(admin_2_name),
                        'data': sorted(series_data, key=lambda x: x['year'])
                    })

    seasons_data = []
    if 'season_name' in df_crop.columns:
        for season_name, df_season in df_crop.groupby('season_name'):
            season_production = df_season['production'].sum()
            season_area = df_season['area'].sum()
            season_yield = season_production / season_area if season_area else 0
            production_systems = df_season['crop_production_system'].unique().tolist() if 'crop_production_system' in df_season.columns else []

            planting_months = []
            if 'planting_month' in df_season.columns:
                planting_months = sorted(df_season['planting_month'].dropna().unique().tolist())

            harvest_months = []
            if 'harvest_month' in df_season.columns:
                harvest_months = sorted(df_season['harvest_month'].dropna().unique().tolist())

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
        'time_series_data': time_series_data,
        'season_specific_breakdown': seasons_data,
    }


@app.route('/api/countries')
def get_countries():
    app.logger.info(f"Request received for /api/countries from {request.remote_addr}")
    if not data.empty and 'country' in data.columns:
        unique_countries = sorted(data['country'].dropna().unique().tolist())
        app.logger.info(f"Found {len(unique_countries)} countries. Returning list.")
        return jsonify(unique_countries)
    app.logger.warning("Country data is empty or 'country' column missing. Returning empty list.")
    return jsonify([])

@app.route('/api/admin1')
def get_admin1_levels():
    app.logger.info(f"Request received for /api/admin1 from {request.remote_addr} with args: {request.args}")
    country = request.args.get('country')
    
    if not country:
        app.logger.warning("Missing 'country' parameter in /api/admin1 request.")
        return jsonify({"error": "Country parameter is required"}), 400
    
    if data.empty:
        app.logger.error("Data not loaded, cannot serve /api/admin1 request.")
        return jsonify({"error": "Data not loaded or CSV processing failed on server."}), 500
    
    # Filter by country
    country_data = data[data['country'] == country].copy()
    if country_data.empty:
        app.logger.info(f"No data found for country: {country}")
        return jsonify({"error": f"No data found for country: {country}"}), 404
    
    if 'admin_1' not in country_data.columns:
        app.logger.warning("admin_1 column not found in data.")
        return jsonify([])
    
    unique_admin1 = sorted(country_data['admin_1'].dropna().unique().tolist())
    app.logger.info(f"Found {len(unique_admin1)} admin1 levels for {country}. Returning list.")
    return jsonify(unique_admin1)

@app.route('/api/admin2')
def get_admin2_levels():
    app.logger.info(f"Request received for /api/admin2 from {request.remote_addr} with args: {request.args}")
    country = request.args.get('country')
    admin_1_name = request.args.get('admin_1_name')
    
    if not country:
        app.logger.warning("Missing 'country' parameter in /api/admin2 request.")
        return jsonify({"error": "Country parameter is required"}), 400
    
    if not admin_1_name:
        app.logger.warning("Missing 'admin_1_name' parameter in /api/admin2 request.")
        return jsonify({"error": "admin_1_name parameter is required"}), 400
    
    if data.empty:
        app.logger.error("Data not loaded, cannot serve /api/admin2 request.")
        return jsonify({"error": "Data not loaded or CSV processing failed on server."}), 500
    
    # Filter by country and admin_1
    filtered_data = data[
        (data['country'] == country) & (data['admin_1'] == admin_1_name)
    ].copy()
    
    if filtered_data.empty:
        app.logger.info(f"No data found for admin_1: {admin_1_name} in country: {country}")
        return jsonify({"error": f"No data found for admin_1: {admin_1_name} in country: {country}"}), 404
    
    if 'admin_2' not in filtered_data.columns:
        app.logger.warning("admin_2 column not found in data.")
        return jsonify([])
    
    unique_admin2 = sorted(filtered_data['admin_2'].dropna().unique().tolist())
    app.logger.info(f"Found {len(unique_admin2)} admin2 levels for {admin_1_name} in {country}. Returning list.")
    return jsonify(unique_admin2)

@app.route('/api/data')
def get_data():
    app.logger.info(f"Request received for /api/data from {request.remote_addr} with args: {request.args}")
    country = request.args.get('country')
    admin_level_str = request.args.get('admin_level')
    timeseries_admin_level_str = request.args.get('timeseries_admin_level', '0')
    split_by_season_str = request.args.get('split_by_season', 'false')

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

    try:
        timeseries_admin_level = int(timeseries_admin_level_str)
    except ValueError:
        app.logger.warning(f"Invalid 'timeseries_admin_level' parameter: {timeseries_admin_level_str}. Must be integer.")
        return jsonify({"error": "timeseries_admin_level must be an integer (0, 1, or 2)"}), 400

    split_by_season = split_by_season_str.lower() == 'true'

    if admin_level not in [0, 1, 2]:
        app.logger.warning(f"Invalid 'admin_level' value: {admin_level}. Must be 0, 1, or 2.")
        return jsonify({"error": "admin_level must be 0, 1, or 2"}), 400
    
    if timeseries_admin_level not in [0, 1, 2]:
        app.logger.warning(f"Invalid 'timeseries_admin_level' value: {timeseries_admin_level}. Must be 0, 1, or 2.")
        return jsonify({"error": "timeseries_admin_level must be 0, 1, or 2"}), 400

    if data.empty:
        app.logger.error("Data not loaded, cannot serve /api/data request.")
        return jsonify({"error": "Data not loaded or CSV processing failed on server."}), 500

    # Filter by country
    country_data = data[data['country'] == country].copy()
    if country_data.empty:
        app.logger.info(f"No data found for country: {country}")
        return jsonify({"error": f"No data found for country: {country}"}), 404

    response_data = {
        "country": country,
        "admin_level": admin_level,
    }
    app.logger.info(f"Processing data for Country: {country}, Admin Level: {admin_level}")

    if admin_level == 0: # National level
        response_data['unique_crops_count'] = country_data['product'].nunique() if 'product' in country_data else 0
        response_data['total_national_production'] = country_data['production'].sum() if 'production' in country_data else 0
        response_data['unique_admin_1_units_count'] = country_data['admin_1'].nunique() if 'admin_1' in country_data else 0

        planting_years = country_data['planting_year'].dropna() if 'planting_year' in country_data else pd.Series(dtype='float64')
        response_data['min_planting_year'] = int(planting_years.min()) if not planting_years.empty else None
        response_data['max_planting_year'] = int(planting_years.max()) if not planting_years.empty else None
        response_data['missing_planting_years'] = get_missing_years(planting_years)

        crops_summary = {}
        if 'product' in country_data.columns:
            # Check if total_national_production is NaN (e.g. if all productions are NaN)
            total_prod_for_calc = response_data['total_national_production']
            if pd.isna(total_prod_for_calc): total_prod_for_calc = 0

            for crop_name, df_crop in country_data.groupby('product'):
                crops_summary[crop_name] = calculate_crop_details(df_crop, total_prod_for_calc, timeseries_admin_level, split_by_season)
        response_data['crops_summary'] = crops_summary

    elif admin_level == 1: # Admin 1 level
        admin_1_name = request.args.get('admin_1_name')
        if not admin_1_name:
            app.logger.warning("Missing 'admin_1_name' for admin_level 1.")
            return jsonify({"error": "admin_1_name parameter is required for admin_level 1"}), 400

        admin_1_data = country_data[country_data['admin_1'] == admin_1_name].copy()
        if admin_1_data.empty:
            app.logger.info(f"No data for Admin 1: {admin_1_name} in {country}")
            return jsonify({"error": f"No data found for Admin 1: {admin_1_name} in {country}"}), 404

        app.logger.info(f"Processing Admin-1 level data for {admin_1_name}")
        response_data['admin_1_name'] = admin_1_name
        response_data['unique_crops_count'] = admin_1_data['product'].nunique() if 'product' in admin_1_data else 0
        response_data['total_admin_1_production'] = admin_1_data['production'].sum() if 'production' in admin_1_data else 0
        response_data['unique_admin_2_units_count'] = admin_1_data['admin_2'].nunique() if 'admin_2' in admin_1_data else 0

        planting_years = admin_1_data['planting_year'].dropna() if 'planting_year' in admin_1_data else pd.Series(dtype='float64')
        response_data['min_planting_year'] = int(planting_years.min()) if not planting_years.empty else None
        response_data['max_planting_year'] = int(planting_years.max()) if not planting_years.empty else None
        response_data['missing_planting_years'] = get_missing_years(planting_years)

        crops_summary = {}
        if 'product' in admin_1_data.columns:
            total_prod_for_calc = response_data['total_admin_1_production']
            if pd.isna(total_prod_for_calc): total_prod_for_calc = 0
            for crop_name, df_crop in admin_1_data.groupby('product'):
                crops_summary[crop_name] = calculate_crop_details(df_crop, total_prod_for_calc, timeseries_admin_level, split_by_season)
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
            (country_data['admin_1'] == admin_1_name) & (country_data['admin_2'] == admin_2_name)
        ].copy()

        if admin_2_data.empty:
            app.logger.info(f"No data for Admin 2: {admin_2_name} in Admin 1: {admin_1_name}, Country: {country}")
            return jsonify({"error": f"No data found for Admin 2: {admin_2_name} in Admin 1: {admin_1_name}, Country: {country}"}), 404

        app.logger.info(f"Processing Admin-2 level data for {admin_2_name} in {admin_1_name}")
        response_data['admin_1_name'] = admin_1_name
        response_data['admin_2_name'] = admin_2_name
        response_data['unique_crops_count'] = admin_2_data['product'].nunique() if 'product' in admin_2_data else 0
        response_data['total_admin_2_production'] = admin_2_data['production'].sum() if 'production' in admin_2_data else 0

        planting_years = admin_2_data['planting_year'].dropna() if 'planting_year' in admin_2_data else pd.Series(dtype='float64')
        response_data['min_planting_year'] = int(planting_years.min()) if not planting_years.empty else None
        response_data['max_planting_year'] = int(planting_years.max()) if not planting_years.empty else None
        response_data['missing_planting_years'] = get_missing_years(planting_years)

        crops_summary = {}
        if 'product' in admin_2_data.columns:
            total_prod_for_calc = response_data['total_admin_2_production']
            if pd.isna(total_prod_for_calc): total_prod_for_calc = 0
            for crop_name, df_crop in admin_2_data.groupby('product'):
                crops_summary[crop_name] = calculate_crop_details(df_crop, total_prod_for_calc, timeseries_admin_level, split_by_season)
        response_data['crops_summary'] = crops_summary

    app.logger.info(f"Successfully processed /api/data request. Returning data for {country}, Level {admin_level}.")
    return jsonify(response_data)

@app.route('/api/crop-timeseries')
def get_crop_timeseries():
    app.logger.info(f"Request received for /api/crop-timeseries from {request.remote_addr} with args: {request.args}")
    country = request.args.get('country')
    admin_level_str = request.args.get('admin_level')
    crop_name = request.args.get('crop_name')
    timeseries_admin_level_str = request.args.get('timeseries_admin_level', '0')
    split_by_season_str = request.args.get('split_by_season', 'false')

    if not country:
        app.logger.warning("Missing 'country' parameter in /api/crop-timeseries request.")
        return jsonify({"error": "Country parameter is required"}), 400
    if not admin_level_str:
        app.logger.warning("Missing 'admin_level' parameter in /api/crop-timeseries request.")
        return jsonify({"error": "admin_level parameter is required"}), 400
    if not crop_name:
        app.logger.warning("Missing 'crop_name' parameter in /api/crop-timeseries request.")
        return jsonify({"error": "crop_name parameter is required"}), 400

    try:
        admin_level = int(admin_level_str)
    except ValueError:
        app.logger.warning(f"Invalid 'admin_level' parameter: {admin_level_str}. Must be integer.")
        return jsonify({"error": "admin_level must be an integer (0, 1, or 2)"}), 400

    try:
        timeseries_admin_level = int(timeseries_admin_level_str)
    except ValueError:
        app.logger.warning(f"Invalid 'timeseries_admin_level' parameter: {timeseries_admin_level_str}. Must be integer.")
        return jsonify({"error": "timeseries_admin_level must be an integer (0, 1, or 2)"}), 400

    split_by_season = split_by_season_str.lower() == 'true'

    if admin_level not in [0, 1, 2]:
        app.logger.warning(f"Invalid 'admin_level' value: {admin_level}. Must be 0, 1, or 2.")
        return jsonify({"error": "admin_level must be 0, 1, or 2"}), 400
    
    if timeseries_admin_level not in [0, 1, 2]:
        app.logger.warning(f"Invalid 'timeseries_admin_level' value: {timeseries_admin_level}. Must be 0, 1, or 2.")
        return jsonify({"error": "timeseries_admin_level must be 0, 1, or 2"}), 400

    if data.empty:
        app.logger.error("Data not loaded, cannot serve /api/crop-timeseries request.")
        return jsonify({"error": "Data not loaded or CSV processing failed on server."}), 500

    # Filter by country
    country_data = data[data['country'] == country].copy()
    if country_data.empty:
        app.logger.info(f"No data found for country: {country}")
        return jsonify({"error": f"No data found for country: {country}"}), 404

    # Apply admin level filtering
    if admin_level == 1:
        admin_1_name = request.args.get('admin_1_name')
        if not admin_1_name:
            app.logger.warning("Missing 'admin_1_name' for admin_level 1.")
            return jsonify({"error": "admin_1_name parameter is required for admin_level 1"}), 400
        country_data = country_data[country_data['admin_1'] == admin_1_name].copy()
        if country_data.empty:
            app.logger.info(f"No data for Admin 1: {admin_1_name} in {country}")
            return jsonify({"error": f"No data found for Admin 1: {admin_1_name} in {country}"}), 404

    elif admin_level == 2:
        admin_1_name = request.args.get('admin_1_name')
        admin_2_name = request.args.get('admin_2_name')
        if not admin_1_name or not admin_2_name:
            app.logger.warning("Missing admin names for admin_level 2.")
            return jsonify({"error": "admin_1_name and admin_2_name parameters are required for admin_level 2"}), 400
        country_data = country_data[
            (country_data['admin_1'] == admin_1_name) & (country_data['admin_2'] == admin_2_name)
        ].copy()
        if country_data.empty:
            app.logger.info(f"No data for Admin 2: {admin_2_name} in Admin 1: {admin_1_name}, Country: {country}")
            return jsonify({"error": f"No data found for Admin 2: {admin_2_name} in Admin 1: {admin_1_name}, Country: {country}"}), 404

    # Filter by crop
    crop_data = country_data[country_data['product'] == crop_name].copy()
    if crop_data.empty:
        app.logger.info(f"No data found for crop: {crop_name}")
        return jsonify({"error": f"No data found for crop: {crop_name}"}), 404

    # Calculate crop details with specified timeseries admin level
    crop_details = calculate_crop_details(crop_data, 0, timeseries_admin_level, split_by_season)
    
    app.logger.info(f"Successfully processed /api/crop-timeseries request for {crop_name} in {country}.")
    return jsonify({
        "crop_name": crop_name,
        "time_series_data": crop_details.get('time_series_data', [])
    })

if __name__ == '__main__':
    # Make sure to set debug=False for production environments
    app.run(debug=True) # Set debug=False in a production environment
