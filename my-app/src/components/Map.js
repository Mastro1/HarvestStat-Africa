import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'; // Removed Popup, will be added back via GeoJSON
import 'leaflet/dist/leaflet.css';

// Default icon fix for react-leaflet (important if using Markers, though less so for GeoJSON popups)
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = ({ data }) => { // data prop is filteredData from App.js
  const [geoJsonData, setGeoJsonData] = useState(null);
  const geoJsonLayerRef = useRef(null);

  // Fetch GeoJSON data for country boundaries - this remains as it's static map geometry
  useEffect(() => {
    fetch('/africa.geojson')
      .then(res => res.json())
      .then(gjData => setGeoJsonData(gjData))
      .catch(err => console.error("Error fetching GeoJSON:", err));
  }, []);

  // Removed internal useEffect fetching agricultural data and agriculturalData state

  const getCountryStyle = (feature) => {
    const countryName = feature.properties.name; // Or use ISO code if available and consistent

    // Find relevant data from the `data` prop (filteredData from App.js)
    // We might have multiple entries if no specific crop/year is selected, or if data is structured per crop/year.
    // For choropleth, we usually need a single value per country.
    // Let's sum up 'Value' for the country if multiple entries exist in filteredData for it.
    const countryEntries = data ? data.filter(d => d.Country === countryName) : [];
    let totalValueForCountry = 0;
    if (countryEntries.length > 0) {
      totalValueForCountry = countryEntries.reduce((sum, entry) => sum + (entry.Value || 0), 0);
    }

    let fillColor = '#D3D3D3'; // Default color for countries with no data or zero value
    if (totalValueForCountry > 0) {
      // Simple color scale based on 'Value'. Needs refinement for a real application.
      if (totalValueForCountry > 1000) fillColor = '#006837'; // Dark Green
      else if (totalValueForCountry > 500) fillColor = '#31a354'; // Medium Green
      else if (totalValueForCountry > 200) fillColor = '#78c679'; // Light Green
      else if (totalValueForCountry > 100) fillColor = '#c2e699'; // Very Light Green
      else if (totalValueForCountry > 0) fillColor = '#ffffcc';   // Pale Yellow
    }

    return {
      fillColor: fillColor,
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      const countryName = feature.properties.name;
      // Get data for this country from the `data` prop
      const countryEntries = data ? data.filter(d => d.Country === countryName) : [];

      let popupContent = `<strong>${countryName}</strong><br/>`;
      if (countryEntries.length > 0) {
        // If multiple entries (e.g. different crops/years for the same country), list them
        countryEntries.forEach(entry => {
          popupContent += `${entry.Crop || 'N/A'} (${entry.Year || 'N/A'}): ${entry.Value !== null ? entry.Value.toLocaleString() : 'N/A'}<br/>`;
        });
        // Optionally, add a total if there are multiple entries
        if (countryEntries.length > 1) {
          const total = countryEntries.reduce((sum, item) => sum + (item.Value || 0), 0);
          popupContent += `<strong>Total Value (filtered): ${total.toLocaleString()}</strong>`;
        }
      } else {
        popupContent += "No filtered data available.";
      }
      layer.bindPopup(popupContent);
    }
  };

  // Recalculate styles when the `data` prop (filteredData) or geoJsonData changes
  useEffect(() => {
    if (geoJsonLayerRef.current && geoJsonData) { // Ensure geoJsonData is loaded
      // Reset styles for all layers first if features might be removed from data
      geoJsonLayerRef.current.eachLayer(layer => {
        layer.setStyle(getCountryStyle(layer.feature));
      });
    }
  }, [data, geoJsonData]); // Dependency on `data` (filteredData) is key


  const position = [0, 20]; // Centered around Africa
  const zoom = 3;

  if (!geoJsonData) {
    return <div>Loading map data...</div>;
  }

  return (
    <MapContainer center={position} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Key added to GeoJSON to force re-render when data prop changes if needed,
          but direct style update via ref is usually better for performance.
          The ref approach is used above.
      */}
      <GeoJSON
        ref={geoJsonLayerRef}
        data={geoJsonData}
        style={getCountryStyle}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
};

export default Map;
