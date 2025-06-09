import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchData } from '../dataUtils'; // Assuming dataUtils.js is in src

// Default icon fix for react-leaflet (important if using Markers, though less so for GeoJSON popups)
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [agriculturalData, setAgriculturalData] = useState([]);
  const geoJsonLayerRef = useRef(null);

  // Fetch GeoJSON data for country boundaries
  useEffect(() => {
    fetch('/africa.geojson') // Path to your GeoJSON file in public folder
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error("Error fetching GeoJSON:", err));
  }, []);

  // Fetch agricultural data
  useEffect(() => {
    fetchData()
      .then(data => {
        setAgriculturalData(data);
      })
      .catch(err => console.error("Error fetching agricultural data:", err));
  }, []);

  const getCountryStyle = (feature) => {
    // Find the agricultural data for the current country
    // This is a simple example; you might want to aggregate data (e.g., sum of 'Value' for a specific crop)
    const countryName = feature.properties.name; // Or use ISO code if available and consistent
    const countryAgriData = agriculturalData.find(d => d.Country === countryName);

    let fillColor = '#D3D3D3'; // Default color for countries with no data
    if (countryAgriData && countryAgriData.Value) {
      // Simple color scale based on 'Value'. Needs refinement.
      if (countryAgriData.Value > 200) fillColor = 'green';
      else if (countryAgriData.Value > 100) fillColor = 'yellow';
      else if (countryAgriData.Value > 0) fillColor = 'orange';
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
      const countryData = agriculturalData.filter(d => d.Country === countryName);

      let popupContent = `<strong>${countryName}</strong><br/>`;
      if (countryData.length > 0) {
        countryData.forEach(entry => {
          popupContent += `${entry.Crop || 'N/A'}: ${entry.Value || 'N/A'} (Year: ${entry.Year || 'N/A'})<br/>`;
        });
      } else {
        popupContent += "No agricultural data available.";
      }
      layer.bindPopup(popupContent);
    }
  };

  // Recalculate styles when agriculturalData changes
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle(getCountryStyle);
    }
  }, [agriculturalData, geoJsonData]);


  const position = [0, 20]; // Centered around Africa
  const zoom = 3;

  if (!geoJsonData) {
    return <div>Loading map data...</div>;
  }

  return (
    <MapContainer center={position} zoom={zoom} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
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
