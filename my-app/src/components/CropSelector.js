import React from 'react';

const CropSelector = ({ crops, selectedCrop, onCropChange }) => {
  return (
    <div>
      <label htmlFor="crop-select">Select Crop: </label>
      <select id="crop-select" value={selectedCrop} onChange={(e) => onCropChange(e.target.value)}>
        <option value="">--All Crops--</option>
        {crops && crops.map(crop => (
          <option key={crop} value={crop}>{crop}</option>
        ))}
      </select>
    </div>
  );
};

export default CropSelector;
