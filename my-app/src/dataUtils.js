import Papa from 'papaparse';

export const fetchData = async () => {
  // Assuming the CSV file will be in public/hvstat_africa_data_v1.0.csv
  const response = await fetch('/hvstat_africa_data_v1.0.csv');
  const reader = response.body.getReader();
  const result = await reader.read();
  const decoder = new TextDecoder('utf-8');
  const csv = decoder.decode(result.value);
  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

// Removed filterByCountry and filterByCrop functions as they are unused.
// App.js implements its own filtering logic directly.
