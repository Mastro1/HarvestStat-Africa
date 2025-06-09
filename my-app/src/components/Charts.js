import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ data, selectedCrop, selectedCountries, selectedYear }) => {
  if (!data || data.length === 0) {
    return <p>No data available for charting. Apply filters to see charts.</p>;
  }

  let chartData;
  let options;

  // If multiple countries are selected, group by country.
  // If a single country (or no country for global view) is selected, group by year.
  if (selectedCountries && selectedCountries.length > 1) {
    // COMPARE COUNTRIES for selectedCrop (and selectedYear if specified)
    const datasets = [];
    const labels = selectedCountries; // X-axis will be countries

    // Define a color palette for different crops or a default one
    const colorPalette = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
    ];

    // If a specific crop is selected, we show that crop's value for each country.
    // If no specific crop is selected, we might sum all crop values or pick top N crops.
    // For simplicity, let's assume if a crop is selected, we use it. Otherwise, total value.

    const cropToDisplay = selectedCrop || 'Total Production';

    const countryValues = selectedCountries.map(country => {
      return data
        .filter(item => item.Country === country) // Data is already filtered by App.js for selected countries
        .reduce((sum, item) => sum + (item.Value || 0), 0);
    });

    datasets.push({
      label: `${cropToDisplay} ${selectedYear ? `in ${selectedYear}` : '(All Years)'}`,
      data: countryValues,
      backgroundColor: selectedCountries.map((_, i) => colorPalette[i % colorPalette.length]),
    });

    chartData = { labels, datasets };
    options = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: `Comparison for ${cropToDisplay} ${selectedYear ? `in ${selectedYear}` : '(Aggregated over selected years)'}` },
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Value' } }, x: { title: { display: true, text: 'Country' }}},
    };

  } else {
    // SINGLE COUNTRY (or all data if no country selected) VIEW: Group by Year (as before)
    const countryName = selectedCountries && selectedCountries.length === 1 ? selectedCountries[0] : (allDataHasOneCountry(data) ? data[0].Country : 'All Selected Countries');
    const aggregatedData = data.reduce((acc, item) => {
      const year = item.Year || 'Unknown Year';
      const value = item.Value || 0;
      if (!acc[year]) acc[year] = 0;
      acc[year] += value;
      return acc;
    }, {});

    chartData = {
      labels: Object.keys(aggregatedData).sort(),
      datasets: [
        {
          label: `Production Value for ${selectedCrop || 'All Crops'} in ${countryName}`,
          data: Object.values(aggregatedData),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };
    options = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: `Production Over Years ${selectedCrop ? 'for ' + selectedCrop : ''} ${countryName ? 'in ' + countryName : ''}` },
      },
      scales: { y: { beginAtZero: true, title: {display: true, text: 'Total Value'}}, x: {title: {display: true, text: 'Year'}}},
    };
  }

  // Helper function to check if all data items are for the same country (when selectedCountries is empty)
  function allDataHasOneCountry(allFilteredData) {
    if (!allFilteredData || allFilteredData.length === 0) return false;
    const firstCountry = allFilteredData[0].Country;
    return allFilteredData.every(item => item.Country === firstCountry);
  }


  return <Bar data={chartData} options={options} />;
};

export default Charts;
