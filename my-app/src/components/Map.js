import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// selectedCountryA3Code is the code for the country whose subnational boundaries might be shown
// currentCountryHasAdmin2Data indicates if the selected country's ag data has Admin2 level detail
const Map = ({ data, selectedCountryA3Code, currentCountryHasAdmin2Data, onAdminUnitSelect }) => {
  const [countryBoundariesData, setCountryBoundariesData] = useState(null); // Base Africa map
  const [currentAdminBoundaries, setCurrentAdminBoundaries] = useState(null); // Holds Admin1 or Admin2 GeoJSON
  const [currentDisplayLevel, setCurrentDisplayLevel] = useState('country'); // 'country', 'admin1', 'admin2'

  const geoJsonLayerRef = useRef(null);
  const mapRef = useRef(null);

  // Fetch base country-level boundaries (africa_detailed.geojson)
  useEffect(() => {
    fetch('/africa_detailed.geojson')
      .then(res => res.json())
      .then(gjData => setCountryBoundariesData(gjData))
      .catch(err => console.error("Error fetching country-level GeoJSON:", err));
  }, []);

  // Effect to load Admin1 or Admin2 boundaries based on selection and data availability
  useEffect(() => {
    setCurrentAdminBoundaries(null); // Reset current admin boundaries
    if (selectedCountryA3Code) {
      let boundaryPath = '';
      let targetLevel = '';

      if (currentCountryHasAdmin2Data) {
        // Try to load Admin2 first if data suggests its presence
        boundaryPath = `/geojson/${selectedCountryA3Code}_admin2.geojson`; // Assuming a single Admin2 file per country
        targetLevel = 'admin2';
      } else {
        // Fallback to Admin1 if no Admin2 data or Admin2 file not specifically needed by default
        boundaryPath = `/geojson/${selectedCountryA3Code}_admin1.geojson`;
        targetLevel = 'admin1';
      }

      console.log(`Attempting to fetch: ${boundaryPath} for level: ${targetLevel}`);
      fetch(boundaryPath)
        .then(res => {
          if (!res.ok) {
            // If Admin2 fails, and we tried it first, try Admin1 as fallback
            if (targetLevel === 'admin2' && !currentCountryHasAdmin2Data) { // Correction: Only fallback if Admin2 wasn't specifically expected due to data
                 throw new Error (`Tried ${targetLevel} but failed, and no specific Admin2 data indicated.`);
            } else if (targetLevel === 'admin2' && currentCountryHasAdmin2Data) { // If Admin2 was expected but failed, try Admin1
                 console.warn(`Admin2 file not found at ${boundaryPath}, attempting Admin1.`);
                 boundaryPath = `/geojson/${selectedCountryA3Code}_admin1.geojson`;
                 targetLevel = 'admin1';
                 return fetch(boundaryPath).then(resAdmin1 => {
                    if(!resAdmin1.ok) throw new Error(`Admin1 boundaries also not found for ${selectedCountryA3Code}`);
                    return resAdmin1.json();
                 });
            }
            throw new Error(`Boundaries not found at ${boundaryPath}`);
          }
          return res.json();
        })
        .then(adminData => {
          setCurrentAdminBoundaries(adminData);
          setCurrentDisplayLevel(targetLevel);
        })
        .catch(err => {
          console.warn(err.message);
          setCurrentAdminBoundaries(null); // Clear if fetch fails
          setCurrentDisplayLevel('country');
        });
    } else { // No single country selected
      setCurrentAdminBoundaries(null);
      setCurrentDisplayLevel('country');
    }
  }, [selectedCountryA3Code, currentCountryHasAdmin2Data]);


  const getStyle = (feature) => {
    let featureName = "", fillColor = '#D3D3D3', level = 0;

    if (currentDisplayLevel === 'admin2' && currentAdminBoundaries) {
        featureName = feature.properties.ADMIN2NAME;
        level = 2;
    } else if (currentDisplayLevel === 'admin1' && currentAdminBoundaries) {
        featureName = feature.properties.ADMIN1NAME;
        level = 1;
    } else {
        featureName = feature.properties.ADM0_EN; // Country name
        level = 0;
    }

    // Basic highlighting for the actively selected admin unit (if any)
    // This needs selectedAdminUnit from App.js to be passed as a prop to Map.js
    // if (selectedAdminUnit && featureName === selectedAdminUnit.name && level === selectedAdminUnit.level) {
    //   fillColor = 'rgba(255, 165, 0, 0.5)'; // Orange highlight
    // }
    // else {
      // Data-driven coloring (simplified example, needs proper data structure in `data` prop)
      // For this to work, `data` prop should be filtered by App.js to the relevant admin level
      const entries = data ? data.filter(d =>
          (level === 2 && d.Admin_2 === featureName && d.Country === feature.properties.ADM0_A3_ReferencedInAdmin2) || // TODO: Ensure correct country matching
          (level === 1 && d.Admin_1 === featureName && d.Country === feature.properties.ADM0_A3_ReferencedInAdmin1) ||
          (level === 0 && d.Country === featureName)
        ) : [];

      if (entries.length > 0) {
          const totalValue = entries.reduce((sum, entry) => sum + (entry.Production || 0), 0);
          if (totalValue > 1000) fillColor = '#006837';
          else if (totalValue > 500) fillColor = '#31a354';
          else if (totalValue > 200) fillColor = '#78c679';
          else if (totalValue > 100) fillColor = '#c2e699';
          else if (totalValue > 0) fillColor = '#ffffcc';
      }
    // }

    if (currentDisplayLevel === 'country' && selectedCountryA3Code && feature.properties.ADM0_A3 === selectedCountryA3Code && !currentAdminBoundaries){
      fillColor = 'rgba(0,0,255,0.3)'; // Blueish highlight for selected country if no admin boundaries shown
    }

    return { fillColor, weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 };
  };

  const onEachFeatureCallback = (feature, layer) => {
    let popupContent = "";
    const props = feature.properties;

    if (currentDisplayLevel === 'admin2' && props && props.ADMIN2NAME) {
      popupContent = `<strong>${props.ADMIN2NAME}</strong> (Admin2)<br/>Parent Admin1: ${props.ADMIN1NAME}`; // ADMIN1NAME must be in Admin2 GeoJSON
      layer.on({ click: () => onAdminUnitSelect && onAdminUnitSelect({ name: props.ADMIN2NAME, level: 2, admin1Parent: props.ADMIN1NAME }) });
    } else if (currentDisplayLevel === 'admin1' && props && props.ADMIN1NAME) {
      popupContent = `<strong>${props.ADMIN1NAME}</strong> (Admin1)`;
      layer.on({ click: () => onAdminUnitSelect && onAdminUnitSelect({ name: props.ADMIN1NAME, level: 1 }) });
    } else if (currentDisplayLevel === 'country' && props && props.ADM0_EN) {
      popupContent = `<strong>${props.ADM0_EN} (${props.ADM0_PCODE})</strong><br/>Code: ${props.ADM0_A3}`;
      // No click action for country level to drill down further from map, selection is via dropdown
    }
    layer.bindPopup(popupContent);
  };

  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.clearLayers();
      const displayData = currentAdminBoundaries || countryBoundariesData; // Show admin if available, else country

      if (displayData) {
        geoJsonLayerRef.current.addData(displayData);
        geoJsonLayerRef.current.eachLayer(layer => layer.setStyle(getStyle(layer.feature)));
        if (mapRef.current && geoJsonLayerRef.current.getBounds().isValid()) {
          mapRef.current.fitBounds(geoJsonLayerRef.current.getBounds());
        }
      }
    }
  // Ensure `data` is a dependency if getStyle directly uses it for coloring based on current data prop
  }, [currentDisplayLevel, currentAdminBoundaries, countryBoundariesData, data, selectedCountryA3Code]);

  if (!countryBoundariesData) return <div>Loading map base data...</div>;

  return (
    <MapContainer ref={mapRef} center={[0,20]} zoom={3} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'/>
      <GeoJSON ref={geoJsonLayerRef} style={getStyle} onEachFeature={onEachFeatureCallback} />
    </MapContainer>
  );
};

export default Map;
