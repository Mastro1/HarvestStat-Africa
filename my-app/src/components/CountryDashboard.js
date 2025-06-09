import React from 'react';
import './CountryDashboard.css'; // We'll create this for basic styling

const CountryDashboard = ({ aggregatedCountryData, countryName }) => {
  if (!aggregatedCountryData) {
    return <div className="country-dashboard-loading">Select a single country to view its detailed analysis.</div>;
  }

  const { nationalTotals, cropDetails } = aggregatedCountryData;

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number') return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="country-dashboard">
      <h2># {countryName} National Agricultural Analysis</h2>

      <section className="national-overview">
        <h3>National Overview</h3>
        <div className="overview-grid">
          <p><strong>Number of Unique Products:</strong> {nationalTotals.uniqueProducts}</p>
          <p><strong>Total Country Production (mt):</strong> {formatNumber(nationalTotals.totalProduction)}</p>
          <p><strong>Administrative Level Focus:</strong> {nationalTotals.adminLevelFocus}</p>
          <p><strong>Number of Sub-national Units (Admin 1):</strong> {nationalTotals.numberOfAdmin1Units}</p>
          <p><strong>Years Covered (Planting Year):</strong> {nationalTotals.yearsCovered}</p>
          <p><strong>Gaps in Years:</strong> {nationalTotals.yearGaps && nationalTotals.yearGaps.length > 0 ? nationalTotals.yearGaps.join(', ') : 'None'}</p>
        </div>
      </section>

      <section className="crop-production-analysis">
        <h3>Detailed Crop Production Analysis</h3>
        {cropDetails && cropDetails.length > 0 ? cropDetails.map((crop, index) => (
          <div key={index} className="crop-item">
            <h4>{crop.productName}</h4>
            <div className="overall-stats">
              <h5>Overall Production Statistics:</h5>
              <p>Total Production (mt): {formatNumber(crop.overallStats.totalProduction)}</p>
              <p>Total Area (ha): {formatNumber(crop.overallStats.totalArea)}</p>
              <p>Average Yield (mt/ha): {formatNumber(crop.overallStats.averageYield, 3)}</p>
              <p>% of Country Total Production: {formatNumber(crop.overallStats.percentageOfCountryTotal)}%</p>
            </div>

            <h5>Season-specific Analysis:</h5>
            {crop.seasonAnalysis && crop.seasonAnalysis.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Production (mt)</th>
                    <th>% of Crop</th>
                    <th>Area (ha)</th>
                    <th>Avg Yield (mt/ha)</th>
                    <th>Production Systems</th>
                    <th>Planting Months</th>
                    <th>Harvest Months</th>
                  </tr>
                </thead>
                <tbody>
                  {crop.seasonAnalysis.map((season, sIndex) => (
                    <tr key={sIndex}>
                      <td>{season.seasonName}</td>
                      <td>{formatNumber(season.production)}</td>
                      <td>{formatNumber(season.percentageOfCropTotalInSeason)}%</td>
                      <td>{formatNumber(season.area)}</td>
                      <td>{formatNumber(season.averageYield, 3)}</td>
                      <td>{season.productionSystems}</td>
                      <td>{season.plantingMonths}</td>
                      <td>{season.harvestMonths}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>No season-specific data available for this crop.</p>}
          </div>
        )) : <p>No crop details available for this country.</p>}
      </section>
    </div>
  );
};

export default CountryDashboard;
