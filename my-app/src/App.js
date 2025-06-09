import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { fetchData, aggregateDataForCountry, aggregateDataForAdmin1, aggregateDataForAdmin2 } from './dataUtils';
import Map from './components/Map';
import CountrySelector from './components/CountrySelector';
import CropSelector from './components/CropSelector';
import DataSummary from './components/DataSummary';
import Charts from './components/Charts';
import CountryDashboard from './components/CountryDashboard';
import Admin1Dashboard from './components/Admin1Dashboard';
import Admin2Dashboard from './components/Admin2Dashboard'; // Import Admin2Dashboard
import './App.css';

function App() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryFeatures, setCountryFeatures] = useState([]);
  const [crops, setCrops] = useState([]);
  const [years, setYears] = useState([]);

  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedCountryA3Code, setSelectedCountryA3Code] = useState(null);
  const [currentCountryHasAdmin2Data, setCurrentCountryHasAdmin2Data] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [selectedAdminUnit, setSelectedAdminUnit] = useState(null); // {name: string, level: 1 | 2, admin1Parent?: string}

  const [countryDashboardData, setCountryDashboardData] = useState(null);
  const [admin1DashboardData, setAdmin1DashboardData] = useState(null);
  const [admin2DashboardData, setAdmin2DashboardData] = useState(null);

  useEffect(() => {
    fetch('/africa_detailed.geojson')
      .then(res => res.json())
      .then(gjData => setCountryFeatures(gjData.features || []))
      .catch(err => console.error("Error fetching initial country features:", err));
  }, []);

  useEffect(() => {
    const loadAgData = async () => {
      try {
        const data = await fetchData();
        setAllData(data);
        const uniqueCountriesNames = [...new Set(data.map(item => item.Country).filter(Boolean))].sort();
        setCountries(uniqueCountriesNames);
        const uniqueCrops = [...new Set(data.map(item => item.Product).filter(Boolean))].sort();
        setCrops(uniqueCrops);
        const uniqueYears = [...new Set(data.map(item => parseInt(item.Planting_Year, 10)).filter(item => !isNaN(item)))].sort((a,b) => b - a);
        setYears(uniqueYears);
        setFilteredData(data);
      } catch (error) {
        console.error("Error loading agricultural data:", error);
      }
    };
    loadAgData();
  }, []);

  useEffect(() => {
    let currentProcessedData = allData;
    let currentSelectedCountryName = null;
    let currentSelectedCountryA3 = null;
    let hasAdmin2 = false;

    if (selectedCountries.length === 1) {
      currentSelectedCountryName = selectedCountries[0];
      const countrySpecificData = allData.filter(item => item.Country === currentSelectedCountryName);
      currentProcessedData = countrySpecificData;

      const countryFeat = countryFeatures.find(f => f.properties.ADM0_EN === currentSelectedCountryName);
      if (countryFeat) currentSelectedCountryA3 = countryFeat.properties.ADM0_A3;

      if (countrySpecificData.some(item => item.Admin_2 && String(item.Admin_2).trim() !== '' && String(item.Admin_2).toLowerCase() !== 'none')) {
        hasAdmin2 = true;
      }
    } else {
      if (selectedCountries.length > 0) {
        currentProcessedData = currentProcessedData.filter(item => selectedCountries.includes(item.Country));
      }
    }
    setSelectedCountryA3Code(currentSelectedCountryA3);
    setCurrentCountryHasAdmin2Data(hasAdmin2);

    setCountryDashboardData(null);
    setAdmin1DashboardData(null);
    setAdmin2DashboardData(null);

    if (currentSelectedCountryName && allData.length > 0) {
      if (selectedAdminUnit?.level === 2 && selectedAdminUnit.admin1Parent) {
        const aggAdmin2 = aggregateDataForAdmin2(allData, currentSelectedCountryName, selectedAdminUnit.admin1Parent, selectedAdminUnit.name);
        setAdmin2DashboardData(aggAdmin2);
      } else if (selectedAdminUnit?.level === 1) {
        const aggAdmin1 = aggregateDataForAdmin1(allData, currentSelectedCountryName, selectedAdminUnit.name);
        setAdmin1DashboardData(aggAdmin1);
      } else {
        const aggCountry = aggregateDataForCountry(allData, currentSelectedCountryName);
        setCountryDashboardData(aggCountry);
      }
    }

    if (selectedCrop) {
      currentProcessedData = currentProcessedData.filter(item => item.Product === selectedCrop);
    }
    if (selectedYear) {
      currentProcessedData = currentProcessedData.filter(item => String(item.Planting_Year) === String(selectedYear));
    }
    setFilteredData(currentProcessedData);

  }, [selectedCountries, selectedCrop, selectedYear, selectedAdminUnit, allData, countryFeatures]);

  const handleAdminUnitSelect = (adminUnitSelection) => {
    if (JSON.stringify(selectedAdminUnit) === JSON.stringify(adminUnitSelection)) {
      setSelectedAdminUnit(null);
    } else {
      setSelectedAdminUnit(adminUnitSelection);
    }
    console.log(`Admin Unit Selected in App.js: `, adminUnitSelection);
  };

  useEffect(() => {
    setSelectedAdminUnit(null);
  }, [selectedCountries]);

  useEffect(() => { // If Admin1 selection is cleared (e.g. by clicking it again), clear Admin2 as well
    if (selectedAdminUnit?.level !== 1 && selectedAdminUnit?.level !==2) { // effectively if selectedAdminUnit is null or has no level
        setSelectedAdminUnit(null); // ensure it's fully cleared if partially cleared
    } else if (selectedAdminUnit?.level === 1 && selectedAdminUnit?.admin1Parent) { //This case should not happen if object is well formed
        //This means an admin2 unit was cleared by setting its parent, which is not logical.
        // setSelectedAdminUnit({name: selectedAdminUnit.name, level: 1}); // Correct it to be a proper Admin1 selection
    }
    // This effect primarily handles deselecting Admin2 if Admin1 context changes.
    // Direct deselection of Admin2 by clicking it is handled in handleAdminUnitSelect.
  }, [selectedAdminUnit?.name, selectedAdminUnit?.level]); // Re-evaluate if selectedAdminUnit object's key properties change


  const handleDownload = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'filtered_hvstat_africa_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const YearSelector = ({ years, selectedYear, onYearChange }) => {
    return (
      <div>
        <label htmlFor="year-select">Select Year: </label>
        <select id="year-select" value={selectedYear} onChange={(e) => onYearChange(e.target.value)}>
          <option value="">--All Years--</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header"><h1>Africa Agricultural Data Visualizer</h1></header>
      <main>
        <div className="controls">
          <CountrySelector countries={countries} selectedCountries={selectedCountries} onCountryChange={setSelectedCountries} />
          <CropSelector crops={crops} selectedCrop={selectedCrop} onCropChange={setSelectedCrop} />
          <YearSelector years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} />
          <button onClick={handleDownload} style={{ marginTop: '10px' }}>Download Filtered Data (CSV)</button>
        </div>
        <div className="main-content-area">
          <div className="map-and-insights">
            <div className="map-container">
              <Map
                data={filteredData}
                selectedCountryA3Code={selectedCountryA3Code}
                currentCountryHasAdmin2Data={currentCountryHasAdmin2Data}
                onAdminUnitSelect={handleAdminUnitSelect}
              />
            </div>
            <div className="insights-container">
              <DataSummary data={filteredData} />
              <Charts data={filteredData} selectedCrop={selectedCrop} selectedCountries={selectedCountries} selectedYear={selectedYear}/>
            </div>
          </div>

          {countryDashboardData && !selectedAdminUnit && (
            <div className="dashboard-container">
              <CountryDashboard aggregatedCountryData={countryDashboardData} countryName={selectedCountries[0]} />
            </div>
          )}
          {admin1DashboardData && selectedAdminUnit?.level === 1 && (
            <div className="dashboard-container admin1-dashboard-container">
              <Admin1Dashboard aggregatedAdmin1Data={admin1DashboardData} />
            </div>
          )}
          {admin2DashboardData && selectedAdminUnit?.level === 2 && (
            <div className="dashboard-container admin2-dashboard-container">
              <Admin2Dashboard aggregatedAdmin2Data={admin2DashboardData} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
