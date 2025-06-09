import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Text } from 'recharts';
import './App.css';

// Custom Tick for XAxis to prevent overlap and improve readability
const CustomXAxisTick = (props) => {
  const { x, y, payload } = props;
  // Rotates labels 90 degrees for better readability
  return (
    <Text x={x} y={y} width={100} textAnchor="end" verticalAnchor="middle" angle={-90} fontSize="0.9em">
      {payload.value}
    </Text>
  );
};


// Crop Time Series Component with independent admin level control
const CropTimeSeriesComponent = ({ 
  crop, 
  initialTimeSeriesData, 
  selectedCountry, 
  selectedAdminLevel, 
  selectedAdmin1Name, 
  selectedAdmin2Name 
}) => {
  const [timeSeriesData, setTimeSeriesData] = useState(initialTimeSeriesData || []);
  const [metric, setMetric] = useState('yield');
  const [adminLevel, setAdminLevel] = useState('0');
  const [loading, setLoading] = useState(false);

  const fetchCropTimeSeriesData = async (cropName, cropAdminLevel) => {
    if (!selectedCountry || !cropName) return null;

    try {
      const params = {
        country: selectedCountry,
        admin_level: selectedAdminLevel,
        crop_name: cropName,
        timeseries_admin_level: cropAdminLevel
      };

      if (selectedAdminLevel === '1') {
        params.admin_1_name = selectedAdmin1Name.trim();
      } else if (selectedAdminLevel === '2') {
        params.admin_1_name = selectedAdmin1Name.trim();
        params.admin_2_name = selectedAdmin2Name.trim();
      }

      const response = await axios.get('/api/crop-timeseries', { params });
      return response.data.time_series_data;
    } catch (error) {
      console.error('Error fetching crop time series data:', error);
      return null;
    }
  };

  const handleAdminLevelChange = async (newAdminLevel) => {
    setAdminLevel(newAdminLevel);
    setLoading(true);
    
    const newData = await fetchCropTimeSeriesData(crop, newAdminLevel);
    if (newData) {
      setTimeSeriesData(newData);
    }
    setLoading(false);
  };

  const getTimeSeriesConfig = () => {
    switch (metric) {
      case 'production':
        return {
          dataKey: 'production',
          unit: 't',
          yAxisLabel: 'Production (t)',
          lineName: 'Production',
          color: '#00796b'
        };
      case 'area':
        return {
          dataKey: 'area',
          unit: 'ha',
          yAxisLabel: 'Area Harvested (ha)',
          lineName: 'Area Harvested',
          color: '#ff9800'
        };
      case 'yield':
        return {
          dataKey: 'yield',
          unit: 't/ha',
          yAxisLabel: 'Yield (t/ha)',
          lineName: 'Yield',
          color: '#4caf50'
        };
      default:
        return {
          dataKey: 'yield',
          unit: 't/ha',
          yAxisLabel: 'Yield (t/ha)',
          lineName: 'Yield',
          color: '#4caf50'
        };
    }
  };

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return <p>No time series data available for this crop.</p>;
  }

  return (
    <div className="crop-timeseries-section">
      <div className="crop-chart-controls">
        <h5>Time Series Analysis</h5>
        <div className="crop-selectors">
          <div className="crop-metric-selector">
            <label htmlFor={`crop-metric-${crop}`}>Metric:</label>
            <select
              id={`crop-metric-${crop}`}
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              <option value="yield">Yield</option>
              <option value="production">Production</option>
              <option value="area">Area Harvested</option>
            </select>
          </div>
          <div className="crop-admin-selector">
            <label htmlFor={`crop-admin-${crop}`}>Time Series Level:</label>
            <select
              id={`crop-admin-${crop}`}
              value={adminLevel}
              onChange={(e) => handleAdminLevelChange(e.target.value)}
              disabled={loading}
            >
              <option value="0">Aggregated</option>
              <option value="1">Admin-1 Regions</option>
              <option value="2">Admin-2 Regions</option>
            </select>
          </div>
        </div>
      </div>
      <div className="crop-chart-container">
        {loading ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading time series data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={(() => {
                // Combine all time series data into a single dataset for multiple lines
                const allYears = new Set();
                timeSeriesData.forEach(series => {
                  series.data.forEach(point => allYears.add(point.year));
                });
                
                return Array.from(allYears).sort().map(year => {
                  const point = { year };
                  timeSeriesData.forEach(series => {
                    const dataPoint = series.data.find(d => d.year === year);
                    if (dataPoint) {
                      point[series.admin_unit] = dataPoint[getTimeSeriesConfig().dataKey];
                    }
                  });
                  return point;
                });
              })()} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                type="number"
                scale="linear"
                domain={['dataMin', 'dataMax']}
              />
              <YAxis
                label={{ value: getTimeSeriesConfig().yAxisLabel, angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => metric === 'yield' ? value.toFixed(2) : value.toLocaleString()}
              />
              <Tooltip 
                formatter={(value, name) => [
                  metric === 'yield' ? 
                    `${value.toFixed(2)} ${getTimeSeriesConfig().unit}` : 
                    `${value.toLocaleString()} ${getTimeSeriesConfig().unit}`,
                  name
                ]}
                labelFormatter={(value) => `Year: ${value}`}
              />
              <Legend />
              {timeSeriesData.map((series, index) => (
                <Line 
                  key={series.admin_unit}
                  type="monotone" 
                  dataKey={series.admin_unit}
                  stroke={`hsl(${(index * 137.5) % 360}, 70%, 45%)`}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={series.admin_unit}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

function App() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedAdminLevel, setSelectedAdminLevel] = useState('0'); // Default to National
  const [selectedAdmin1Name, setSelectedAdmin1Name] = useState('');
  const [selectedAdmin2Name, setSelectedAdmin2Name] = useState('');
  const [admin1Options, setAdmin1Options] = useState([]);
  const [admin2Options, setAdmin2Options] = useState([]);
  const [expandedCrops, setExpandedCrops] = useState(new Set());
  const [selectedChartMetric, setSelectedChartMetric] = useState('yield');
  const [timeSeriesAdminLevel, setTimeSeriesAdminLevel] = useState('0');

  const [data, setData] = useState(null);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAdmin1, setLoadingAdmin1] = useState(false);
  const [loadingAdmin2, setLoadingAdmin2] = useState(false);
  const [error, setError] = useState(null);

  const dataDisplayRef = useRef(null); // For scrolling to data section

  useEffect(() => {
    axios.get('/api/countries')
      .then(response => {
        setCountries(response.data || []);
        setLoadingCountries(false);
      })
      .catch(err => {
        console.error("Error fetching countries:", err);
        setError('Failed to load countries. Is the backend server running? Please try refreshing.');
        setLoadingCountries(false);
      });
  }, []);

  const fetchAdmin1Options = (country) => {
    if (!country) {
      setAdmin1Options([]);
      return;
    }
    
    setLoadingAdmin1(true);
    axios.get('/api/admin1', { params: { country } })
      .then(response => {
        setAdmin1Options(response.data || []);
        setLoadingAdmin1(false);
      })
      .catch(err => {
        console.error("Error fetching admin1 options:", err);
        setAdmin1Options([]);
        setLoadingAdmin1(false);
      });
  };

  const fetchAdmin2Options = (country, admin1Name) => {
    if (!country || !admin1Name) {
      setAdmin2Options([]);
      return;
    }
    
    setLoadingAdmin2(true);
    axios.get('/api/admin2', { params: { country, admin_1_name: admin1Name } })
      .then(response => {
        setAdmin2Options(response.data || []);
        setLoadingAdmin2(false);
      })
      .catch(err => {
        console.error("Error fetching admin2 options:", err);
        setAdmin2Options([]);
        setLoadingAdmin2(false);
      });
  };

  // Fetch admin1 options when country changes
  useEffect(() => {
    if (selectedCountry && (selectedAdminLevel === '1' || selectedAdminLevel === '2')) {
      fetchAdmin1Options(selectedCountry);
    } else {
      setAdmin1Options([]);
    }
    setSelectedAdmin1Name('');
    setSelectedAdmin2Name('');
    setAdmin2Options([]);
  }, [selectedCountry, selectedAdminLevel]);

  // Fetch admin2 options when admin1 selection changes
  useEffect(() => {
    if (selectedCountry && selectedAdmin1Name && selectedAdminLevel === '2') {
      fetchAdmin2Options(selectedCountry, selectedAdmin1Name);
    } else {
      setAdmin2Options([]);
    }
    setSelectedAdmin2Name('');
  }, [selectedCountry, selectedAdmin1Name, selectedAdminLevel]);

  const toggleCropExpansion = (cropName) => {
    setExpandedCrops(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cropName)) {
        newSet.delete(cropName);
      } else {
        newSet.add(cropName);
      }
      return newSet;
    });
  };

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setData(null);
    setSelectedAdmin1Name('');
    setSelectedAdmin2Name('');
    setAdmin1Options([]);
    setAdmin2Options([]);
    setExpandedCrops(new Set());
    setTimeSeriesAdminLevel('0');
    setError(null); // Clear error on new selection
  };

  const handleAdminLevelChange = (event) => {
    setSelectedAdminLevel(event.target.value);
    setData(null);
    setSelectedAdmin1Name('');
    setSelectedAdmin2Name('');
    setAdmin1Options([]);
    setAdmin2Options([]);
    setExpandedCrops(new Set());
    setTimeSeriesAdminLevel('0');
    setError(null); // Clear error on new selection
  };

  const resetSelections = () => {
    setSelectedCountry('');
    setSelectedAdminLevel('0');
    setSelectedAdmin1Name('');
    setSelectedAdmin2Name('');
    setAdmin1Options([]);
    setAdmin2Options([]);
    setExpandedCrops(new Set());
    setTimeSeriesAdminLevel('0');
    setData(null);
    setError(null);
  };

  const isFetchDisabled = () => {
    if (!selectedCountry || loadingData) return true;
    if (selectedAdminLevel === '1' && !selectedAdmin1Name.trim()) return true;
    if (selectedAdminLevel === '2' && (!selectedAdmin1Name.trim() || !selectedAdmin2Name.trim())) return true;
    return false;
  };

  const fetchData = () => {
    // Explicit check for required fields before attempting to fetch
    if (!selectedCountry) {
        setError("Please select a country first.");
        return;
    }
    if (selectedAdminLevel === '1' && !selectedAdmin1Name.trim()) {
        setError("Admin-1 Name is required for Level 1 data.");
        return;
    }
    if (selectedAdminLevel === '2' && (!selectedAdmin1Name.trim() || !selectedAdmin2Name.trim())) {
        setError("Admin-1 and Admin-2 Names are required for Level 2 data.");
        return;
    }

    setLoadingData(true);
    setError(null);
    // setData(null); // Data is reset on selection change, not necessarily on fetch click

    let params = {
      country: selectedCountry,
      admin_level: selectedAdminLevel,
      timeseries_admin_level: timeSeriesAdminLevel
    };

    if (selectedAdminLevel === '1') {
      params.admin_1_name = selectedAdmin1Name.trim();
    } else if (selectedAdminLevel === '2') {
      params.admin_1_name = selectedAdmin1Name.trim();
      params.admin_2_name = selectedAdmin2Name.trim();
    }

    console.log("Fetching data with params:", params);

    axios.get('/api/data', { params })
      .then(response => {
        setData(response.data);
        setLoadingData(false);
        if (response.data && Object.keys(response.data).length > 0 && dataDisplayRef.current) {
          dataDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (!response.data || Object.keys(response.data).length === 0) {
            // Handle cases where API returns success but data is empty/null
            setError("No data found for the current selection. The API returned an empty or null response.");
            setData(null); // Ensure data state is null if response is not usable
        }
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        let errorMessage = 'Failed to load data. An unexpected error occurred.';
        if (err.response) { // Backend returned an error response
            errorMessage = err.response.data?.error || `API Error: ${err.response.status} - ${err.response.statusText || 'Unknown error'}`;
        } else if (err.request) { // Request made but no response received
            errorMessage = 'Network error or backend server unavailable. Please check your connection and try again.';
        } // else: error in setting up the request, err.message would have info
        setError(errorMessage);
        setLoadingData(false);
        setData(null); // Ensure data is cleared on error
      });
  };

  const getChartData = () => {
    if (!data || !data.crops_summary) {
      return [];
    }
    return Object.entries(data.crops_summary).map(([crop, details]) => {
      const production = details.total_production || 0;
      const area = details.total_area_harvested || 0;
      const yield_value = area > 0 ? production / area : 0;
      
      return {
        name: crop,
        production: production,
        area: area,
        yield: yield_value,
      };
    });
  };

  const getChartConfig = () => {
    const baseTitle = data?.country ? `Crop ${selectedChartMetric === 'production' ? 'Production' : selectedChartMetric === 'area' ? 'Area Harvested' : 'Yield'} in ${data.country} ${data.admin_level === 1 && data.admin_1_name ? `(${data.admin_1_name})` : data.admin_level === 2 && data.admin_1_name && data.admin_2_name ? `(${data.admin_2_name} / ${data.admin_1_name})` : '(National)'}` : `Crop ${selectedChartMetric === 'production' ? 'Production' : selectedChartMetric === 'area' ? 'Area Harvested' : 'Yield'}`;
    
    switch (selectedChartMetric) {
      case 'production':
        return {
          title: baseTitle,
          dataKey: 'production',
          unit: 't',
          yAxisLabel: 'Production (t)',
          barName: 'Total Production'
        };
      case 'area':
        return {
          title: baseTitle,
          dataKey: 'area',
          unit: 'ha',
          yAxisLabel: 'Area Harvested (ha)',
          barName: 'Total Area Harvested'
        };
      case 'yield':
        return {
          title: baseTitle,
          dataKey: 'yield',
          unit: 't/ha',
          yAxisLabel: 'Yield (t/ha)',
          barName: 'Average Yield'
        };
      default:
        return {
          title: baseTitle,
          dataKey: 'yield',
          unit: 't/ha',
          yAxisLabel: 'Yield (t/ha)',
          barName: 'Average Yield'
        };
    }
  };





  const renderAdminLevelSpecificSummary = () => {
    if (!data) return null;

    let adminLevelText = `National (Level ${data.admin_level})`;
    let subordinateUnitsText = null;

    if (data.admin_level === 0) {
      subordinateUnitsText = data.unique_admin_1_units_count !== undefined ? <p><strong>Number of Admin-1 Units:</strong> {data.unique_admin_1_units_count}</p> : null;
      adminLevelText = `National (Level ${data.admin_level})`;
    } else if (data.admin_level === 1 && data.admin_1_name) {
      adminLevelText = `Admin-1: ${data.admin_1_name} (Level ${data.admin_level})`;
      subordinateUnitsText = data.unique_admin_2_units_count !== undefined ? <p><strong>Number of Admin-2 Units:</strong> {data.unique_admin_2_units_count}</p> : null;
    } else if (data.admin_level === 2 && data.admin_1_name && data.admin_2_name) {
      adminLevelText = `Admin-2: ${data.admin_2_name} (within ${data.admin_1_name}, Level ${data.admin_level})`;
    }

    let totalProductionKey;
    let totalProductionValue;

    if (data.admin_level === 0) {
        totalProductionKey = 'Total National Production';
        totalProductionValue = data.total_national_production;
    } else if (data.admin_level === 1) {
        totalProductionKey = 'Total Admin-1 Production';
        totalProductionValue = data.total_admin_1_production;
    } else if (data.admin_level === 2) {
        totalProductionKey = 'Total Admin-2 Production';
        totalProductionValue = data.total_admin_2_production;
    }

    return (
      <>
        <p><strong>Admin Level in Focus:</strong> {adminLevelText}</p>
        {totalProductionKey && totalProductionValue !== undefined && <p><strong>{totalProductionKey}:</strong> {totalProductionValue?.toLocaleString()} (t)</p>}
        {data.unique_crops_count !== undefined && <p><strong>Unique Crops Reported:</strong> {data.unique_crops_count}</p>}
        {subordinateUnitsText}
        {(data.min_planting_year || data.max_planting_year) && ( // Only show if at least one year is present
          <p>
            <strong>Planting Years Range:</strong> {data.min_planting_year || 'N/A'} - {data.max_planting_year || 'N/A'}
            {data.missing_planting_years && data.missing_planting_years.length > 0 && (
              <span className="missing-years"> (Missing: {data.missing_planting_years.join(', ')})</span>
            )}
          </p>
        )}
      </>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>HarvestStat Africa Explorer</h1>
      </header>
      <main>
        <div className="controls">
          <div className="control-group">
            <label htmlFor="country-select">Select Country:</label>
            <select
              id="country-select"
              value={selectedCountry}
              onChange={handleCountryChange}
              disabled={loadingCountries || loadingData}
            >
              <option value="">{loadingCountries ? 'Loading...' : '-- Select Country --'}</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="admin-level-select">Select Admin Level:</label>
            <select
              id="admin-level-select"
              value={selectedAdminLevel}
              onChange={handleAdminLevelChange}
              disabled={loadingData}
            >
              <option value="0">National</option>
              <option value="1">Admin-1</option>
              <option value="2">Admin-2</option>
            </select>
          </div>

          { (selectedAdminLevel === '1' || selectedAdminLevel === '2') && (
            <div className="control-group">
              <label htmlFor="admin1-select">Admin-1 Region:</label>
              <select
                id="admin1-select"
                value={selectedAdmin1Name}
                onChange={e => setSelectedAdmin1Name(e.target.value)}
                disabled={loadingData || loadingAdmin1}
              >
                <option value="">{loadingAdmin1 ? 'Loading...' : '-- Select Admin-1 Region --'}</option>
                {admin1Options.map(admin1 => (
                  <option key={admin1} value={admin1}>{admin1}</option>
                ))}
              </select>
            </div>
          )}
          {selectedAdminLevel === '2' && (
            <div className="control-group">
              <label htmlFor="admin2-select">Admin-2 Region:</label>
              <select
                id="admin2-select"
                value={selectedAdmin2Name}
                onChange={e => setSelectedAdmin2Name(e.target.value)}
                disabled={loadingData || loadingAdmin2 || !selectedAdmin1Name}
              >
                <option value="">{loadingAdmin2 ? 'Loading...' : '-- Select Admin-2 Region --'}</option>
                {admin2Options.map(admin2 => (
                  <option key={admin2} value={admin2}>{admin2}</option>
                ))}
              </select>
            </div>
          )}
          <div className="button-group">
            <button onClick={fetchData} disabled={isFetchDisabled()}>
              {loadingData ? 'Fetching...' : 'Fetch Data'}
            </button>
            <button onClick={resetSelections} className="reset-button" disabled={loadingData}>
              Reset
            </button>
          </div>
        </div>

        {loadingData && <div className="loading-indicator"><p>Loading data, please wait...</p></div>}
        {error && <p className="error-message">{error}</p>}

        {data && Object.keys(data).length > 0 && !error && ( // Ensure data is not null/empty and no error
          <div id="data-display-section" ref={dataDisplayRef} className="data-display">
            <h2>Report for {data.country}</h2>
            <div className="report-summary">
              {renderAdminLevelSpecificSummary()}
            </div>

            {data.crops_summary && Object.keys(data.crops_summary).length > 0 ? (
              <>
                <div className="chart-controls">
                  <h3 className="chart-title">{getChartConfig().title}</h3>
                  <div className="chart-selectors">
                    <div className="metric-selector">
                      <label htmlFor="metric-select">Chart Metric:</label>
                      <select
                        id="metric-select"
                        value={selectedChartMetric}
                        onChange={(e) => setSelectedChartMetric(e.target.value)}
                      >
                        <option value="yield">Yield</option>
                        <option value="production">Production</option>
                        <option value="area">Area Harvested</option>
                      </select>
                    </div>
                    <div className="timeseries-admin-selector">
                      <label htmlFor="timeseries-admin-select">Time Series Level:</label>
                      <select
                        id="timeseries-admin-select"
                        value={timeSeriesAdminLevel}
                        onChange={(e) => setTimeSeriesAdminLevel(e.target.value)}
                      >
                        <option value="0">Aggregated</option>
                        <option value="1">Admin-1 Regions</option>
                        <option value="2">Admin-2 Regions</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    {/* Increased bottom margin for XAxis labels if they are long or numerous */}
                    <BarChart data={getChartData()} margin={{ top: 5, right: 20, left: 20, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} />
                      <YAxis
                        label={{ value: getChartConfig().yAxisLabel, angle: -90, position: 'insideLeft', offset:-5 }}
                        tickFormatter={(value) => selectedChartMetric === 'yield' ? value.toFixed(2) : value.toLocaleString()}
                      />
                      <Tooltip formatter={(value) => selectedChartMetric === 'yield' ? `${value.toFixed(2)} ${getChartConfig().unit}` : `${value.toLocaleString()} ${getChartConfig().unit}`} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                      <Bar dataKey={getChartConfig().dataKey} fill="#00796b" name={getChartConfig().barName} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <h3>Crop Specific Analysis</h3>
                {Object.entries(data.crops_summary).map(([crop, details]) => (
                  <div key={crop} className="crop-collapsible">
                    <div 
                      className="crop-header" 
                      onClick={() => toggleCropExpansion(crop)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="crop-name">{crop}</span>
                      <span className="dropdown-arrow">
                        {expandedCrops.has(crop) ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {expandedCrops.has(crop) && (
                      <div className="crop-content">
                        <p><strong>Total Production:</strong> {details.total_production !== undefined ? details.total_production?.toLocaleString() : 'N/A'} (t)</p>
                        <p><strong>Total Area Harvested:</strong> {details.total_area_harvested !== undefined ? details.total_area_harvested?.toLocaleString() : 'N/A'} (ha)</p>
                        <p><strong>Average Yield:</strong> {details.average_yield !== undefined ? details.average_yield?.toFixed(2) : 'N/A'} (t/ha)</p>
                        
                        {/* Time Series Chart */}
                        <CropTimeSeriesComponent 
                          crop={crop} 
                          initialTimeSeriesData={details.time_series_data}
                          selectedCountry={selectedCountry}
                          selectedAdminLevel={selectedAdminLevel}
                          selectedAdmin1Name={selectedAdmin1Name}
                          selectedAdmin2Name={selectedAdmin2Name}
                        />

                        {details.season_specific_breakdown && details.season_specific_breakdown.length > 0 ? (
                          <div className="season-table-container">
                            <h5>Seasonal Breakdown:</h5>
                            <table>
                              <thead>
                                <tr>
                                  <th>Season</th>
                                  <th>Production (t)</th>
                                  <th>Prod. (% of Crop Total)</th>
                                  <th>Area (ha)</th>
                                  <th>Yield (t/ha)</th>
                                  <th>Prod. Systems</th>
                                  <th>Planting Months</th>
                                  <th>Harvest Months</th>
                                </tr>
                              </thead>
                              <tbody>
                                {details.season_specific_breakdown.map(season => (
                                  <tr key={season.season_name}>
                                    <td>{season.season_name || 'N/A'}</td>
                                    <td>{season.production_absolute !== undefined ? season.production_absolute?.toLocaleString() : 'N/A'}</td>
                                    <td>{season.production_percentage_of_crop !== undefined ? `${season.production_percentage_of_crop?.toFixed(1)}%` : 'N/A'}</td>
                                    <td>{season.area_harvested !== undefined ? season.area_harvested?.toLocaleString() : 'N/A'}</td>
                                    <td>{season.yield !== undefined ? season.yield?.toFixed(2) : 'N/A'}</td>
                                    <td>{season.production_systems?.join(', ') || 'N/A'}</td>
                                    <td>{season.planting_months?.join(', ') || 'N/A'}</td>
                                    <td>{season.harvest_months?.join(', ') || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <p>No seasonal breakdown available for this crop.</p>}
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : ( // This part handles when crops_summary is empty or not present
              <p className="no-data-message">No detailed crop summary data available for the selected scope. This could mean the data source contains no specific crop entries for this region/filter, or the region/crop combination has no recorded production or area harvested.</p>
            )}
          </div>
        )}
        {/* Message if data is explicitly set to null (e.g. after an error or during reset) and not loading */}
        {!data && !loadingData && !error && (
            <p className="no-data-message controls-info">Select options above and click "Fetch Data" to view agricultural statistics.</p>
        )}
      </main>
    </div>
  );
}

export default App;
