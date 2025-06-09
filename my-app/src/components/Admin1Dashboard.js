import React from 'react';
import './Admin1Dashboard.css'; // Will create this CSS file

const Admin1Dashboard = ({ aggregatedAdmin1Data }) => {
  if (!aggregatedAdmin1Data) {
    return <div className="admin1-dashboard-loading">Select an Admin Level 1 unit to view its detailed analysis.</div>;
  }

  const { admin1Totals, cropDetails } = aggregatedAdmin1Data;

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number') return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="admin1-dashboard">
      <h2># {admin1Totals.admin1Name} - {admin1Totals.countryName} Agricultural Analysis</h2>

      <section className="admin1-overview">
        <h3>Admin Level 1 Overview</h3>
        <div className="overview-grid">
          <p><strong>Admin Unit:</strong> {admin1Totals.admin1Name}</p>
          <p><strong>Country:</strong> {admin1Totals.countryName}</p>
          <p><strong>Number of Unique Products:</strong> {admin1Totals.uniqueProducts}</p>
          <p><strong>Total Production in Admin Unit (mt):</strong> {formatNumber(admin1Totals.totalProduction)}</p>
          <p><strong>Years Covered (Planting Year):</strong> {admin1Totals.yearsCovered}</p>
          <p><strong>Gaps in Years (for this Admin Unit):</strong> {admin1Totals.yearGaps && admin1Totals.yearGaps.length > 0 ? admin1Totals.yearGaps.join(', ') : 'None'}</p>
        </div>
      </section>

      <section className="crop-production-analysis">
        <h3>Detailed Crop Production Analysis for {admin1Totals.admin1Name}</h3>
        {cropDetails && cropDetails.length > 0 ? cropDetails.map((crop, index) => (
          <div key={index} className="crop-item">
            <h4>{crop.productName}</h4>
            <div className="overall-stats">
              <h5>Overall Production Statistics (in {admin1Totals.admin1Name}):</h5>
              <p>Total Production (mt): {formatNumber(crop.overallStats.totalProduction)}</p>
              <p>Total Area (ha): {formatNumber(crop.overallStats.totalArea)}</p>
              <p>Average Yield (mt/ha): {formatNumber(crop.overallStats.averageYield, 3)}</p>
              {/* Percentage of Admin1 total could be added if calculated in aggregateDataForAdmin1 */}
            </div>

            <h5>Season-specific Analysis (in {admin1Totals.admin1Name}):</h5>
            {crop.seasonAnalysis && crop.seasonAnalysis.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Production (mt)</th>
                    <th>% of Crop (in Admin1)</th>
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
            ) : <p>No season-specific data available for this crop in {admin1Totals.admin1Name}.</p>}
          </div>
        )) : <p>No crop details available for this Admin Level 1 unit.</p>}
      </section>
    </div>
  );
};

export default Admin1Dashboard;
