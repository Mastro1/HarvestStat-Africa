import Papa from 'papaparse';

export const fetchData = async () => {
  const response = await fetch('/hvstat_africa_data_v1.0.csv');
  const reader = response.body.getReader();
  const result = await reader.read();
  const decoder = new TextDecoder('utf-8');
  const csv = decoder.decode(result.value);
  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: (results) => {
        const cleanedData = results.data.map(row => ({
          ...row,
          Production: parseFloat(row.Production) || 0,
          Area: parseFloat(row.Area) || 0,
          Planting_Year: parseInt(row.Planting_Year, 10) || null,
          // Ensure Admin_1 and Admin_2 are treated as strings, trim whitespace
          Admin_1: row.Admin_1 ? String(row.Admin_1).trim() : null,
          Admin_2: row.Admin_2 ? String(row.Admin_2).trim() : null,
        }));
        resolve(cleanedData);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

const getUniqueValues = (data, key) => {
  if (!data || data.length === 0) return [];
  // Filter out null, undefined, and empty strings before creating the Set
  return [...new Set(data.map(item => item[key]).filter(value => value !== null && value !== undefined && String(value).trim() !== ''))];
};

const sumValues = (data, key) => {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
};

const getYearRangeAndGaps = (years) => {
  if (!years || years.length === 0) return { range: "N/A", gaps: [] };
  const numericYears = years.map(y => parseInt(y, 10)).filter(y => !isNaN(y)).sort((a, b) => a - b);
  if (numericYears.length === 0) return { range: "N/A", gaps: [] };

  const minYear = numericYears[0];
  const maxYear = numericYears[numericYears.length - 1];
  const range = `${minYear} to ${maxYear}`;

  const gaps = [];
  if (minYear !== maxYear) {
    for (let year = minYear + 1; year < maxYear; year++) {
      if (!numericYears.includes(year)) {
        gaps.push(year);
      }
    }
  }
  return { range, gaps };
};

export const aggregateDataForCountry = (fullDataset, countryName) => {
  if (!fullDataset || fullDataset.length === 0) return null;

  const countryData = fullDataset.filter(item => item.Country === countryName && item.Product);

  if (countryData.length === 0) return null;

  const uniqueProducts = getUniqueValues(countryData, 'Product');
  const nationalTotalProduction = sumValues(countryData, 'Production');
  const uniqueAdmin1Units = getUniqueValues(countryData, 'Admin_1');
  const allPlantingYears = getUniqueValues(countryData, 'Planting_Year').map(y => parseInt(y,10)).filter(y => !isNaN(y));
  const yearInfo = getYearRangeAndGaps(allPlantingYears);

  const nationalTotals = {
    uniqueProducts: uniqueProducts.length,
    totalProduction: nationalTotalProduction,
    adminLevelFocus: "Admin Level 1",
    numberOfAdmin1Units: uniqueAdmin1Units.length,
    yearsCovered: yearInfo.range,
    yearGaps: yearInfo.gaps,
  };

  const cropDetails = uniqueProducts.map(productName => {
    const cropData = countryData.filter(item => item.Product === productName);

    const cropTotalProduction = sumValues(cropData, 'Production');
    const cropTotalArea = sumValues(cropData, 'Area');
    const cropAverageYield = cropTotalArea > 0 ? cropTotalProduction / cropTotalArea : 0;
    const percentageOfCountryTotal = nationalTotalProduction > 0 ? (cropTotalProduction / nationalTotalProduction) * 100 : 0;

    const overallStats = {
      totalProduction: cropTotalProduction,
      totalArea: cropTotalArea,
      averageYield: cropAverageYield,
      percentageOfCountryTotal: percentageOfCountryTotal,
    };

    const uniqueSeasons = getUniqueValues(cropData, 'Season_Name');
    const seasonAnalysis = uniqueSeasons.map(seasonName => {
      const seasonCropData = cropData.filter(item => item.Season_Name === seasonName);

      const seasonProduction = sumValues(seasonCropData, 'Production');
      const seasonArea = sumValues(seasonCropData, 'Area');
      const seasonAverageYield = seasonArea > 0 ? seasonProduction / seasonArea : 0;
      const percentageOfCropTotalInSeason = cropTotalProduction > 0 ? (seasonProduction / cropTotalProduction) * 100 : 0;

      const productionSystems = getUniqueValues(seasonCropData, 'Crop_Production_System');
      const plantingMonths = getUniqueValues(seasonCropData, 'Planting_Month');
      const harvestMonths = getUniqueValues(seasonCropData, 'Harvest_Month');

      return {
        seasonName: seasonName || "N/A",
        production: seasonProduction,
        percentageOfCropTotalInSeason: percentageOfCropTotalInSeason,
        area: seasonArea,
        averageYield: seasonAverageYield,
        productionSystems: productionSystems.join(', ') || "N/A",
        plantingMonths: plantingMonths.join(', ') || "N/A",
        harvestMonths: harvestMonths.join(', ') || "N/A",
      };
    });

    return {
      productName: productName,
      overallStats: overallStats,
      seasonAnalysis: seasonAnalysis,
    };
  });

  return {
    nationalTotals: nationalTotals,
    cropDetails: cropDetails,
  };
};

export const aggregateDataForAdmin1 = (fullDataset, countryName, admin1Name) => {
  if (!fullDataset || fullDataset.length === 0) return null;

  const admin1Data = fullDataset.filter(item =>
    item.Country === countryName &&
    item.Admin_1 === admin1Name &&
    item.Product
  );

  if (admin1Data.length === 0) return null;

  const uniqueProducts = getUniqueValues(admin1Data, 'Product');
  const admin1TotalProduction = sumValues(admin1Data, 'Production');
  const allPlantingYears = getUniqueValues(admin1Data, 'Planting_Year').map(y => parseInt(y,10)).filter(y => !isNaN(y));
  const yearInfo = getYearRangeAndGaps(allPlantingYears);

  const admin1Totals = {
    admin1Name: admin1Name,
    countryName: countryName,
    uniqueProducts: uniqueProducts.length,
    totalProduction: admin1TotalProduction,
    yearsCovered: yearInfo.range,
    yearGaps: yearInfo.gaps,
  };

  const cropDetails = uniqueProducts.map(productName => {
    const cropData = admin1Data.filter(item => item.Product === productName);

    const cropTotalProduction = sumValues(cropData, 'Production');
    const cropTotalArea = sumValues(cropData, 'Area');
    const cropAverageYield = cropTotalArea > 0 ? cropTotalProduction / cropTotalArea : 0;

    const overallStats = {
      totalProduction: cropTotalProduction,
      totalArea: cropTotalArea,
      averageYield: cropAverageYield,
    };

    const uniqueSeasons = getUniqueValues(cropData, 'Season_Name');
    const seasonAnalysis = uniqueSeasons.map(seasonName => {
      const seasonCropData = cropData.filter(item => item.Season_Name === seasonName);

      const seasonProduction = sumValues(seasonCropData, 'Production');
      const seasonArea = sumValues(seasonCropData, 'Area');
      const seasonAverageYield = seasonArea > 0 ? seasonProduction / seasonArea : 0;
      const percentageOfCropTotalInSeason = cropTotalProduction > 0 ? (seasonProduction / cropTotalProduction) * 100 : 0;

      const productionSystems = getUniqueValues(seasonCropData, 'Crop_Production_System');
      const plantingMonths = getUniqueValues(seasonCropData, 'Planting_Month');
      const harvestMonths = getUniqueValues(seasonCropData, 'Harvest_Month');

      return {
        seasonName: seasonName || "N/A",
        production: seasonProduction,
        percentageOfCropTotalInSeason: percentageOfCropTotalInSeason,
        area: seasonArea,
        averageYield: seasonAverageYield,
        productionSystems: productionSystems.join(', ') || "N/A",
        plantingMonths: plantingMonths.join(', ') || "N/A",
        harvestMonths: harvestMonths.join(', ') || "N/A",
      };
    });

    return {
      productName: productName,
      overallStats: overallStats,
      seasonAnalysis: seasonAnalysis,
    };
  });

  return {
    admin1Totals: admin1Totals,
    cropDetails: cropDetails,
  };
};

// New function for Admin Level 2 aggregation
export const aggregateDataForAdmin2 = (fullDataset, countryName, admin1Name, admin2Name) => {
  if (!fullDataset || fullDataset.length === 0) return null;

  // Filter data for the specific country, admin1, and admin2 unit
  // Assuming Admin_1 and Admin_2 fields in the dataset are strings and might need trimming.
  // Case-insensitive matching is not explicitly done here but could be added if data is inconsistent.
  // The fetchData function now trims Admin_1 and Admin_2, so direct comparison should be fine.
  const admin2Data = fullDataset.filter(item =>
    item.Country === countryName &&
    item.Admin_1 === admin1Name &&
    item.Admin_2 === admin2Name &&
    item.Product // Ensure product exists for crop analysis
  );

  if (admin2Data.length === 0) return null; // No data for the specified admin2 unit

  // Admin2 Totals
  const uniqueProducts = getUniqueValues(admin2Data, 'Product');
  const admin2TotalProduction = sumValues(admin2Data, 'Production');
  const allPlantingYears = getUniqueValues(admin2Data, 'Planting_Year').map(y => parseInt(y,10)).filter(y => !isNaN(y));
  const yearInfo = getYearRangeAndGaps(allPlantingYears);

  const admin2Totals = {
    admin2Name: admin2Name,
    admin1Name: admin1Name,
    countryName: countryName,
    uniqueProducts: uniqueProducts.length,
    totalProduction: admin2TotalProduction,
    yearsCovered: yearInfo.range,
    yearGaps: yearInfo.gaps,
  };

  // Crop Details for Admin2
  const cropDetails = uniqueProducts.map(productName => {
    const cropData = admin2Data.filter(item => item.Product === productName);

    const cropTotalProduction = sumValues(cropData, 'Production');
    const cropTotalArea = sumValues(cropData, 'Area');
    const cropAverageYield = cropTotalArea > 0 ? cropTotalProduction / cropTotalArea : 0;

    const overallStats = {
      totalProduction: cropTotalProduction,
      totalArea: cropTotalArea,
      averageYield: cropAverageYield,
    };

    const uniqueSeasons = getUniqueValues(cropData, 'Season_Name');
    const seasonAnalysis = uniqueSeasons.map(seasonName => {
      const seasonCropData = cropData.filter(item => item.Season_Name === seasonName);

      const seasonProduction = sumValues(seasonCropData, 'Production');
      const seasonArea = sumValues(seasonCropData, 'Area');
      const seasonAverageYield = seasonArea > 0 ? seasonProduction / seasonArea : 0;
      const percentageOfCropTotalInSeason = cropTotalProduction > 0 ? (seasonProduction / cropTotalProduction) * 100 : 0;

      const productionSystems = getUniqueValues(seasonCropData, 'Crop_Production_System');
      const plantingMonths = getUniqueValues(seasonCropData, 'Planting_Month');
      const harvestMonths = getUniqueValues(seasonCropData, 'Harvest_Month');

      return {
        seasonName: seasonName || "N/A",
        production: seasonProduction,
        percentageOfCropTotalInSeason: percentageOfCropTotalInSeason,
        area: seasonArea,
        averageYield: seasonAverageYield,
        productionSystems: productionSystems.join(', ') || "N/A",
        plantingMonths: plantingMonths.join(', ') || "N/A",
        harvestMonths: harvestMonths.join(', ') || "N/A",
      };
    });

    return {
      productName: productName,
      overallStats: overallStats,
      seasonAnalysis: seasonAnalysis,
    };
  });

  return {
    admin2Totals: admin2Totals,
    cropDetails: cropDetails,
  };
};
