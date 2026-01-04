import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './ImageGallery.module.css';

/**
 * ImageGallery
 * Swipeable multi-image viewer with zoom.
 * @param {Array<string>} images - Array of image URLs
 * @param {number} initialIndex - Starting image index
 * @example <ImageGallery images={[...]} initialIndex={0} />
 */
const ImageGallery = ({ images, initialIndex = 0 }) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const handlePrev = () => setIndex(i => Math.max(i - 1, 0));
  const handleNext = () => setIndex(i => Math.min(i + 1, images.length - 1));
  const handleZoom = () => setZoom(z => (z === 1 ? 2 : 1));

  return (
    <div className={styles.container}>
      <button className={styles.nav} onClick={handlePrev} disabled={index === 0} aria-label="Previous image">‹</button>
      <div className={styles.imageWrapper} onClick={handleZoom} aria-label="Zoom image">
        <img
          src={images[index]}
          alt={`Gallery ${index + 1}`}
          className={styles.image}
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
      <button className={styles.nav} onClick={handleNext} disabled={index === images.length - 1} aria-label="Next image">›</button>
      <div className={styles.counter}>{index + 1} / {images.length}</div>
    </div>
  );
};

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialIndex: PropTypes.number
};

export default React.memo(ImageGallery);
