import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './MediaEditor.module.css';

/**
 * MediaEditor - Provides image editing features (filters, crop, brightness, contrast, saturation).
 * @component
 * @param {string} imageUrl - URL of the image to edit
 * @param {function} onSave - Handler to save edited image
 * @param {function} onCancel - Handler to cancel editing
 * @param {boolean} isOpen - Whether the editor is open
 * @returns {React.ReactElement}
 */
const MediaEditor = React.memo(function MediaEditor({ 
  imageUrl, 
  onSave, 
  onCancel, 
  isOpen 
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [filter, setFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const filters = [
    { name: 'None', value: 'none', style: {} },
    { name: 'Vintage', value: 'vintage', style: { filter: 'sepia(0.5) contrast(1.2) brightness(1.1)' } },
    { name: 'B&W', value: 'bw', style: { filter: 'grayscale(1) contrast(1.1)' } },
    { name: 'Warm', value: 'warm', style: { filter: 'sepia(0.3) saturate(1.4) brightness(1.1)' } },
    { name: 'Cool', value: 'cool', style: { filter: 'hue-rotate(180deg) saturate(1.2)' } },
    { name: 'Dramatic', value: 'dramatic', style: { filter: 'contrast(1.5) brightness(0.9) saturate(1.3)' } }
  ];

  useEffect(() => {
    if (isOpen && imageUrl) {
      loadImage();
    }
  }, [isOpen, imageUrl]);

  const loadImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
    img.src = imageUrl;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!img) return;

    canvas.width = 400;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply filters
    ctx.filter = getFilterString();

    // Calculate crop dimensions
    const cropX = (crop.x / 100) * img.width;
    const cropY = (crop.y / 100) * img.height;
    const cropWidth = (crop.width / 100) * img.width;
    const cropHeight = (crop.height / 100) * img.height;

    // Draw cropped image
    ctx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, canvas.width, canvas.height
    );
  };

  const getFilterString = () => {
    const selectedFilter = filters.find(f => f.value === filter);
    let filterStr = selectedFilter?.style?.filter || '';
    
    if (brightness !== 100) {
      filterStr += ` brightness(${brightness}%)`;
    }
    if (contrast !== 100) {
      filterStr += ` contrast(${contrast}%)`;
    }
    if (saturation !== 100) {
      filterStr += ` saturate(${saturation}%)`;
    }
    
    return filterStr || 'none';
  };

  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [filter, brightness, contrast, saturation, crop]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const editedFile = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
      onSave(editedFile);
    }, 'image/jpeg', 0.9);
  };

  const handleCropChange = (dimension, value) => {
    setCrop(prev => ({
      ...prev,
      [dimension]: Math.max(0, Math.min(100, value))
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className={styles.mediaEditorOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.mediaEditor}>
        <div className={styles.editorHeader}>
          <button className={styles.btnSecondary} onClick={onCancel} aria-label="Cancel">
            Cancel
          </button>
          <h3>Edit Photo</h3>
          <button className={styles.btnPrimary} onClick={handleSave} aria-label="Save">
            Save
          </button>
        </div>

        <div className={styles.editorContent}>
          <div className={styles.canvasContainer}>
            <canvas 
              ref={canvasRef}
              className={styles.editCanvas}
              aria-label="Image editor canvas"
            />
          </div>

          <div className={styles.editorControls}>
            {/* Filters */}
            <div className={styles.controlSection}>
              <h4>Filters</h4>
              <div className={styles.filterGrid}>
                {filters.map((f) => (
                  <button
                    key={f.value}
                    className={`${styles.filterBtn} ${filter === f.value ? styles.active : ''}`}
                    onClick={() => setFilter(f.value)}
                    aria-label={`Apply ${f.name} filter`}
                  >
                    <div 
                      className={styles.filterPreview}
                      style={f.style}
                    />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustments */}
            <div className={styles.controlSection}>
              <h4>Adjustments</h4>
              <div className={styles.sliderControls}>
                <div className={styles.sliderControl}>
                  <label>Brightness</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    aria-label="Adjust brightness"
                  />
                  <span>{brightness}%</span>
                </div>
                
                <div className={styles.sliderControl}>
                  <label>Contrast</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    aria-label="Adjust contrast"
                  />
                  <span>{contrast}%</span>
                </div>
                
                <div className={styles.sliderControl}>
                  <label>Saturation</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    aria-label="Adjust saturation"
                  />
                  <span>{saturation}%</span>
                </div>
              </div>
            </div>

            {/* Crop */}
            <div className={styles.controlSection}>
              <h4>Crop</h4>
              <div className={styles.cropControls}>
                <div className={styles.cropPresets}>
                  <button 
                    onClick={() => setCrop({ x: 0, y: 0, width: 100, height: 100 })}
                    aria-label="Crop to original size"
                  >
                    Original
                  </button>
                  <button 
                    onClick={() => setCrop({ x: 12.5, y: 12.5, width: 75, height: 75 })}
                    aria-label="Crop to square"
                  >
                    Square
                  </button>
                  <button 
                    onClick={() => setCrop({ x: 0, y: 12.5, width: 100, height: 75 })}
                    aria-label="Crop to 16:9 aspect ratio"
                  >
                    16:9
                  </button>
                </div>
                
                <div className={styles.cropSliders}>
                  <div className={styles.sliderControl}>
                    <label>X Position</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={crop.x}
                      onChange={(e) => handleCropChange('x', Number(e.target.value))}
                      aria-label="Adjust crop X position"
                    />
                  </div>
                  
                  <div className={styles.sliderControl}>
                    <label>Y Position</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={crop.y}
                      onChange={(e) => handleCropChange('y', Number(e.target.value))}
                      aria-label="Adjust crop Y position"
                    />
                  </div>
                  
                  <div className={styles.sliderControl}>
                    <label>Width</label>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      value={crop.width}
                      onChange={(e) => handleCropChange('width', Number(e.target.value))}
                      aria-label="Adjust crop width"
                    />
                  </div>
                  
                  <div className={styles.sliderControl}>
                    <label>Height</label>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      value={crop.height}
                      onChange={(e) => handleCropChange('height', Number(e.target.value))}
                      aria-label="Adjust crop height"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

MediaEditor.displayName = 'MediaEditor';
MediaEditor.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default MediaEditor;