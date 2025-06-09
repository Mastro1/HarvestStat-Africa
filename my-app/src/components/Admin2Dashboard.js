import React from 'react';
import './Admin2Dashboard.css'; // Will create this CSS file

const Admin2Dashboard = ({ aggregatedAdmin2Data }) => {
  if (!aggregatedAdmin2Data) {
    return <div className="admin2-dashboard-loading">Select an Admin Level 2 unit to view its detailed analysis.</div>;
  }

  const { admin2Totals, cropDetails } = aggregatedAdmin2Data;

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="admin2-dashboard">
      <h2># {admin2Totals.admin2Name} - {admin2Totals.admin1Name}, {admin2Totals.countryName} Agricultural Analysis</h2>

      <section className="admin2-overview">
        <h3>Admin Level 2 Overview</h3>
        <div className="overview-grid">
          <p><strong>Admin Level 2 Unit:</strong> {admin2Totals.admin2Name}</p>
          <p><strong>Parent Admin Level 1 Unit:</strong> {admin2Totals.admin1Name}</p>
          <p><strong>Country:</strong> {admin2Totals.countryName}</p>
          <p><strong>Number of Unique Products:</strong> {admin2Totals.uniqueProducts}</p>
          <p><strong>Total Production in Admin2 Unit (mt):</strong> {formatNumber(admin2Totals.totalProduction)}</p>
          <p><strong>Years Covered (Planting Year):</strong> {admin2Totals.yearsCovered}</p>
          <p><strong>Gaps in Years (for this Admin2 Unit):</strong> {admin2Totals.yearGaps && admin2Totals.yearGaps.length > 0 ? admin2Totals.yearGaps.join(', ') : 'None'}</p>
        </div>
      </section>

      <section className="crop-production-analysis">
        <h3>Detailed Crop Production Analysis for {admin2Totals.admin2Name}</h3>
        {cropDetails && cropDetails.length > 0 ? cropDetails.map((crop, index) => (
          <div key={index} className="crop-item">
            <h4>{crop.productName}</h4>
            <div className="overall-stats">
              <h5>Overall Production Statistics (in {admin2Totals.admin2Name}):</h5>
              <p>Total Production (mt): {formatNumber(crop.overallStats.totalProduction)}</p>
              <p>Total Area (ha): {formatNumber(crop.overallStats.totalArea)}</p>
              <p>Average Yield (mt/ha): {formatNumber(crop.overallStats.averageYield, 3)}</p>
            </div>

            <h5>Season-specific Analysis (in {admin2Totals.admin2Name}):</h5>
            {crop.seasonAnalysis && crop.seasonAnalysis.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Production (mt)</th>
                    <th>% of Crop (in Admin2)</th>
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
            ) : <p>No season-specific data available for this crop in {admin2Totals.admin2Name}.</p>}
          </div>
        )) : <p>No crop details available for this Admin Level 2 unit.</p>}
      </section>
    </div>
  );
};

export default Admin2Dashboard;
