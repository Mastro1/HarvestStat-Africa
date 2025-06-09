import React from 'react';

const DataSummary = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data to display.</p>;
  }

  // Example summary: total value for the filtered data
  const totalValue = data.reduce((sum, item) => sum + (item.Value || 0), 0);
  const numberOfEntries = data.length;

  return (
    <div>
      <h3>Data Summary</h3>
      <p>Number of data entries: {numberOfEntries}</p>
      <p>Total Value: {totalValue}</p>
      {/* You can add more summary statistics here */}
    </div>
  );
};

export default DataSummary;
