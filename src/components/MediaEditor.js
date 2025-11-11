import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './MediaEditor.css';

export default function MediaEditor({ 
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
      className="media-editor-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="media-editor">
        <div className="editor-header">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <h3>Edit Photo</h3>
          <button className="btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>

        <div className="editor-content">
          <div className="canvas-container">
            <canvas 
              ref={canvasRef}
              className="edit-canvas"
            />
          </div>

          <div className="editor-controls">
            {/* Filters */}
            <div className="control-section">
              <h4>Filters</h4>
              <div className="filter-grid">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    className={`filter-btn ${filter === f.value ? 'active' : ''}`}
                    onClick={() => setFilter(f.value)}
                  >
                    <div 
                      className="filter-preview"
                      style={f.style}
                    />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustments */}
            <div className="control-section">
              <h4>Adjustments</h4>
              <div className="slider-controls">
                <div className="slider-control">
                  <label>Brightness</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                  />
                  <span>{brightness}%</span>
                </div>
                
                <div className="slider-control">
                  <label>Contrast</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                  />
                  <span>{contrast}%</span>
                </div>
                
                <div className="slider-control">
                  <label>Saturation</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                  />
                  <span>{saturation}%</span>
                </div>
              </div>
            </div>

            {/* Crop */}
            <div className="control-section">
              <h4>Crop</h4>
              <div className="crop-controls">
                <div className="crop-presets">
                  <button onClick={() => setCrop({ x: 0, y: 0, width: 100, height: 100 })}>
                    Original
                  </button>
                  <button onClick={() => setCrop({ x: 12.5, y: 12.5, width: 75, height: 75 })}>
                    Square
                  </button>
                  <button onClick={() => setCrop({ x: 0, y: 12.5, width: 100, height: 75 })}>
                    16:9
                  </button>
                </div>
                
                <div className="crop-sliders">
                  <div className="slider-control">
                    <label>X Position</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={crop.x}
                      onChange={(e) => handleCropChange('x', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="slider-control">
                    <label>Y Position</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={crop.y}
                      onChange={(e) => handleCropChange('y', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="slider-control">
                    <label>Width</label>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      value={crop.width}
                      onChange={(e) => handleCropChange('width', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="slider-control">
                    <label>Height</label>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      value={crop.height}
                      onChange={(e) => handleCropChange('height', Number(e.target.value))}
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
}