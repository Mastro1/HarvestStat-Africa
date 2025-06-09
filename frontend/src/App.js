import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Text } from 'recharts';
import './App.css';

// Custom Tick for XAxis to prevent overlap and improve readability
const CustomXAxisTick = (props) => {
  const { x, y, payload } = props;
  // Tries to fit the label in a 70px width box, angling it.
  // Adjust width, angle, or textAnchor as needed for your data.
  return (
    <Text x={x} y={y} width={75} textAnchor="middle" verticalAnchor="start" angle={-40} fontSize="0.9em">
      {payload.value}
    </Text>
  );
};


function App() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedAdminLevel, setSelectedAdminLevel] = useState('0'); // Default to National
  const [selectedAdmin1Name, setSelectedAdmin1Name] = useState('');
  const [selectedAdmin2Name, setSelectedAdmin2Name] = useState('');

  const [data, setData] = useState(null);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
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

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setData(null);
    setSelectedAdmin1Name('');
    setSelectedAdmin2Name('');
    setError(null); // Clear error on new selection
  };

  const handleAdminLevelChange = (event) => {
    setSelectedAdminLevel(event.target.value);
    setData(null);
    setSelectedAdmin1Name('');
    setSelectedAdmin2Name('');
    setError(null); // Clear error on new selection
  };

  const resetSelections = () => {
    setSelectedCountry('');
    setSelectedAdminLevel('0');
    setSelectedAdmin1Name('');
    setSelectedAdmin2Name('');
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
      admin_level: selectedAdminLevel
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
    return Object.entries(data.crops_summary).map(([crop, details]) => ({
      name: crop,
      production: details.total_production || 0,
    }));
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

  const chartTitle = data?.country ? `Crop Production in ${data.country} ${data.admin_level === 1 && data.admin_1_name ? `(${data.admin_1_name})` : data.admin_level === 2 && data.admin_1_name && data.admin_2_name ? `(${data.admin_2_name} / ${data.admin_1_name})` : '(National)'}` : "Crop Production";

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
              <label htmlFor="admin1-name">Admin-1 Name:</label>
              <input type="text" id="admin1-name" value={selectedAdmin1Name} onChange={e => setSelectedAdmin1Name(e.target.value)} placeholder="Required for Level 1 & 2" disabled={loadingData}/>
            </div>
          )}
          {selectedAdminLevel === '2' && (
            <div className="control-group">
              <label htmlFor="admin2-name">Admin-2 Name:</label>
              <input type="text" id="admin2-name" value={selectedAdmin2Name} onChange={e => setSelectedAdmin2Name(e.target.value)} placeholder="Required for Level 2" disabled={loadingData}/>
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
                <h3 className="chart-title">{chartTitle}</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    {/* Increased bottom margin for XAxis labels if they are long or numerous */}
                    <BarChart data={getChartData()} margin={{ top: 5, right: 20, left: 20, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} />
                      <YAxis
                        label={{ value: 'Production (t)', angle: -90, position: 'insideLeft', offset:-5 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} t`} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                      <Bar dataKey="production" fill="#00796b" name="Total Production" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <h3>Crop Specific Analysis</h3>
                {Object.entries(data.crops_summary).map(([crop, details]) => (
                  <div key={crop} className="crop-details">
                    <h4>{crop}</h4>
                    <p><strong>Total Production:</strong> {details.total_production !== undefined ? details.total_production?.toLocaleString() : 'N/A'} (t)</p>
                    <p><strong>Total Area Harvested:</strong> {details.total_area_harvested !== undefined ? details.total_area_harvested?.toLocaleString() : 'N/A'} (ha)</p>
                    <p><strong>Average Yield:</strong> {details.average_yield !== undefined ? details.average_yield?.toFixed(2) : 'N/A'} (t/ha)</p>

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
