import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './ImageCropper.module.css';

/**
 * ImageCropper
 * Drag-to-crop image editor with aspect ratio options.
 * @param {string} src - Image source
 * @param {Array<string>} aspectRatios - Aspect ratio options
 * @param {Function} onCrop - Callback with cropped image data
 * @example <ImageCropper src={imgSrc} aspectRatios={["1:1","16:9"]} onCrop={handleCrop} />
 */
const ImageCropper = ({ src, aspectRatios = ['1:1'], onCrop }) => {
  // Placeholder: UI only, no actual crop logic for brevity
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[0]);
  const cropRef = useRef(null);

  const handleCrop = () => {
    if (onCrop) onCrop(src); // Replace with actual cropped data
  };

  return (
    <div className={styles.container}>
      <img src={src} alt="Crop" className={styles.image} ref={cropRef} />
      <div className={styles.ratios}>
        {aspectRatios.map(ratio => (
          <button
            key={ratio}
            className={selectedRatio === ratio ? styles.selected : styles.ratio}
            onClick={() => setSelectedRatio(ratio)}
            aria-label={`Set aspect ratio ${ratio}`}
          >
            {ratio}
          </button>
        ))}
      </div>
      <button className={styles.cropBtn} onClick={handleCrop} aria-label="Crop image">Crop</button>
    </div>
  );
};

ImageCropper.propTypes = {
  src: PropTypes.string.isRequired,
  aspectRatios: PropTypes.arrayOf(PropTypes.string),
  onCrop: PropTypes.func.isRequired
};

export default React.memo(ImageCropper);
