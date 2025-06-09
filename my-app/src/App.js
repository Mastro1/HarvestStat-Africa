import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { fetchData } from './dataUtils';
import Map from './components/Map';
import CountrySelector from './components/CountrySelector';
import CropSelector from './components/CropSelector';
import DataSummary from './components/DataSummary';
import Charts from './components/Charts';
import './App.css';

function App() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [crops, setCrops] = useState([]);
  const [years, setYears] = useState([]);

  const [selectedCountries, setSelectedCountries] = useState([]); // Changed from selectedCountry
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData();
        setAllData(data);

        const uniqueCountries = [...new Set(data.map(item => item.Country).filter(Boolean))].sort();
        const uniqueCrops = [...new Set(data.map(item => item.Crop).filter(Boolean))].sort();
        const uniqueYears = [...new Set(data.map(item => item.Year).filter(item => item !== null && item !== undefined))].sort((a,b) => b - a);

        setCountries(uniqueCountries);
        setCrops(uniqueCrops);
        setYears(uniqueYears);

        setFilteredData(data); // Initialize with all data
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let currentData = allData;

    if (selectedCountries.length > 0) {
      currentData = currentData.filter(item => selectedCountries.includes(item.Country));
    }
    if (selectedCrop) {
      currentData = currentData.filter(item => item.Crop === selectedCrop);
    }
    if (selectedYear) {
      currentData = currentData.filter(item => String(item.Year) === String(selectedYear));
    }
    setFilteredData(currentData);
  }, [selectedCountries, selectedCrop, selectedYear, allData]);

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
      <header className="App-header">
        <h1>Africa Agricultural Data Visualizer</h1>
      </header>
      <main>
        <div className="controls">
          <CountrySelector
            countries={countries}
            selectedCountries={selectedCountries} // Pass array
            onCountryChange={setSelectedCountries} // Expects array
          />
          <CropSelector
            crops={crops}
            selectedCrop={selectedCrop}
            onCropChange={setSelectedCrop}
          />
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
          <button onClick={handleDownload} style={{ marginTop: '10px' }}>
            Download Filtered Data (CSV)
          </button>
        </div>

        <div className="map-container">
          <Map data={filteredData} />
        </div>

        <div className="insights-container">
          <div className="summary-container">
            <DataSummary data={filteredData} />
          </div>
          <div className="chart-container">
            {/* Pass selectedCountries to Charts for comparison logic */}
            <Charts data={filteredData} selectedCrop={selectedCrop} selectedCountries={selectedCountries} selectedYear={selectedYear}/>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
