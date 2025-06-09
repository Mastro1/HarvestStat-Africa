import React from 'react';

const CountrySelector = ({ countries, selectedCountries, onCountryChange }) => {
  const handleSelectChange = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    onCountryChange(selectedOptions);
  };

  return (
    <div>
      <label htmlFor="country-select">Select Countries (Ctrl/Cmd + click for multiple): </label>
      <select
        id="country-select"
        multiple
        value={selectedCountries}
        onChange={handleSelectChange}
        size="5" // Show a few options at once
      >
        {/* No "All Countries" option needed for multi-select, empty array means all */}
        {countries && countries.map(country => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>
      {selectedCountries && selectedCountries.length > 0 && (
        <p><small>Selected: {selectedCountries.join(', ')}</small></p>
      )}
    </div>
  );
};

export default CountrySelector;
