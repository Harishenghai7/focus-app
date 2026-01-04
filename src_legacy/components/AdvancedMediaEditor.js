import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './AdvancedMediaEditor.module.css';

/**
 * AdvancedMediaEditor - Provides advanced image editing (filters, stickers, text overlays).
 * @component
 * @param {string} imageUrl - URL of the image to edit
 * @param {function} onSave - Handler to save edited image
 * @param {function} onCancel - Handler to cancel editing
 * @param {boolean} isOpen - Whether the editor is open
 * @returns {React.ReactElement}
 */
const AdvancedMediaEditor = React.memo(function AdvancedMediaEditor({ 
  imageUrl, 
  onSave, 
  onCancel, 
  isOpen 
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [activeTab, setActiveTab] = useState('filters');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [currentText, setCurrentText] = useState('');

  const arFilters = [
    { name: 'None', value: 'none', preview: '🚫' },
    { name: 'Vintage', value: 'vintage', preview: '📸' },
    { name: 'Neon', value: 'neon', preview: '🌈' },
    { name: 'Cyberpunk', value: 'cyberpunk', preview: '🤖' },
    { name: 'Dreamy', value: 'dreamy', preview: '☁️' },
    { name: 'Film', value: 'film', preview: '🎞️' },
    { name: 'Glitch', value: 'glitch', preview: '📺' },
    { name: 'Retro', value: 'retro', preview: '🕹️' },
    { name: 'Sunset', value: 'sunset', preview: '🌅' }
  ];

  const stickerPacks = [
    { category: 'Emojis', items: ['😀', '😍', '🤩', '😎', '🥳', '😂', '🤔', '😴'] },
    { category: 'Hearts', items: ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍'] },
    { category: 'Nature', items: ['🌟', '⭐', '✨', '🌙', '☀️', '🌈', '🔥', '💫'] },
    { category: 'Fun', items: ['🎉', '🎊', '🎈', '🎁', '🏆', '👑', '💎', '🦄'] }
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

    // Apply filter
    ctx.filter = getFilterCSS();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // Draw stickers
    stickers.forEach(sticker => {
      ctx.font = `${sticker.size}px Arial`;
      ctx.fillText(sticker.emoji, sticker.x, sticker.y);
    });

    // Draw text overlays
    textOverlays.forEach(text => {
      ctx.font = `bold ${text.size}px Arial`;
      ctx.fillStyle = text.color;
      ctx.strokeStyle = text.outline;
      ctx.lineWidth = 2;
      ctx.strokeText(text.content, text.x, text.y);
      ctx.fillText(text.content, text.x, text.y);
    });
  };

  const getFilterCSS = () => {
    const filters = {
      none: 'none',
      vintage: 'sepia(0.8) contrast(1.2) brightness(1.1) saturate(0.8)',
      neon: 'contrast(1.5) brightness(1.2) saturate(2) hue-rotate(90deg)',
      cyberpunk: 'contrast(1.8) brightness(0.9) saturate(1.5) hue-rotate(270deg)',
      dreamy: 'blur(0.5px) brightness(1.3) saturate(1.2) contrast(0.8)',
      film: 'contrast(1.1) brightness(1.1) saturate(0.9) sepia(0.1)',
      glitch: 'contrast(2) brightness(0.8) saturate(2) hue-rotate(180deg)',
      retro: 'sepia(0.4) contrast(1.3) brightness(1.2) saturate(1.1)',
      sunset: 'sepia(0.3) saturate(1.4) brightness(1.1) contrast(1.1) hue-rotate(15deg)'
    };
    return filters[selectedFilter] || 'none';
  };

  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [selectedFilter, stickers, textOverlays]);

  const addSticker = (emoji) => {
    const newSticker = {
      id: Date.now(),
      emoji,
      x: Math.random() * 300 + 50,
      y: Math.random() * 300 + 50,
      size: 40
    };
    setStickers(prev => [...prev, newSticker]);
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) return;
    
    const newText = {
      id: Date.now(),
      content: currentText,
      x: 200,
      y: 200,
      size: 24,
      color: '#ffffff',
      outline: '#000000'
    };
    setTextOverlays(prev => [...prev, newText]);
    setCurrentText('');
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const editedFile = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
      onSave(editedFile);
    }, 'image/jpeg', 0.9);
  };

  const renderFilters = () => (
    <div className={styles.editorTabContent}>
      <div className={styles.filtersGrid}>
        {arFilters.map((filter) => (
          <motion.button
            key={filter.value}
            className={`${styles.filterOption} ${selectedFilter === filter.value ? styles.active : ''}`}
            onClick={() => setSelectedFilter(filter.value)}
            whileTap={{ scale: 0.95 }}
            aria-label={`Apply ${filter.name} filter`}
          >
            <div className={styles.filterPreview}>
              <span className={styles.filterEmoji}>{filter.preview}</span>
            </div>
            <span className={styles.filterName}>{filter.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderStickers = () => (
    <div className={styles.editorTabContent}>
      {stickerPacks.map((pack) => (
        <div key={pack.category} className={styles.stickerPack}>
          <h4 className={styles.stickerPackTitle}>{pack.category}</h4>
          <div className={styles.stickersGrid}>
            {pack.items.map((emoji, index) => (
              <motion.button
                key={index}
                className={styles.stickerBtn}
                onClick={() => addSticker(emoji)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                aria-label={`Add ${emoji} sticker`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderText = () => (
    <div className={styles.editorTabContent}>
      <div className={styles.textControls}>
        <div className={styles.textInputGroup}>
          <input
            type="text"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Enter text..."
            className={styles.textInput}
            maxLength={50}
            aria-label="Text overlay input"
          />
          <button 
            className={styles.addTextBtn}
            onClick={addTextOverlay}
            disabled={!currentText.trim()}
            aria-label="Add text overlay"
          >
            Add Text
          </button>
        </div>
        
        {textOverlays.length > 0 && (
          <div className={styles.textOverlaysList}>
            <h4 className={styles.textOverlaysTitle}>Text Overlays</h4>
            {textOverlays.map((text) => (
              <div key={text.id} className={styles.textOverlayItem}>
                <span>"{text.content}"</span>
                <button 
                  onClick={() => setTextOverlays(prev => prev.filter(t => t.id !== text.id))}
                  className={styles.removeTextBtn}
                  aria-label={`Remove text overlay "${text.content}"`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderEffects = () => (
    <div className={styles.editorTabContent}>
      <div className={styles.effectsGrid}>
        <button className={styles.effectBtn} onClick={() => setSelectedFilter('glitch')} aria-label="Apply Glitch effect">
          <span className={styles.effectIcon}>📺</span>
          <span>Glitch</span>
        </button>
        <button className={styles.effectBtn} onClick={() => setSelectedFilter('neon')} aria-label="Apply Neon Glow effect">
          <span className={styles.effectIcon}>🌈</span>
          <span>Neon Glow</span>
        </button>
        <button className={styles.effectBtn} onClick={() => setSelectedFilter('dreamy')} aria-label="Apply Dreamy Blur effect">
          <span className={styles.effectIcon}>☁️</span>
          <span>Dreamy Blur</span>
        </button>
        <button className={styles.effectBtn} onClick={() => setSelectedFilter('cyberpunk')} aria-label="Apply Cyberpunk effect">
          <span className={styles.effectIcon}>🤖</span>
          <span>Cyberpunk</span>
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <motion.div 
      className={styles.advancedEditorOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.advancedEditor}>
        <div className={styles.editorHeader}>
          <button className={styles.btnSecondary} onClick={onCancel} aria-label="Cancel editing">
            Cancel
          </button>
          <h3 className={styles.editorTitle}>Edit Photo</h3>
          <button className={styles.btnPrimary} onClick={handleSave} aria-label="Save edited image">
            Save
          </button>
        </div>

        <div className={styles.editorBody}>
          <div className={styles.canvasSection}>
            <canvas 
              ref={canvasRef}
              className={styles.editCanvas}
              aria-label="Image editor canvas"
            />
          </div>

          <div className={styles.editorControls}>
            <div className={styles.editorTabs}>
              {[
                { id: 'filters', label: 'Filters', icon: '🎨' },
                { id: 'stickers', label: 'Stickers', icon: '😀' },
                { id: 'text', label: 'Text', icon: '📝' },
                { id: 'effects', label: 'Effects', icon: '✨' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.editorTab} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={`Edit ${tab.label}`}
                >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'filters' && renderFilters()}
              {activeTab === 'stickers' && renderStickers()}
              {activeTab === 'text' && renderText()}
              {activeTab === 'effects' && renderEffects()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

AdvancedMediaEditor.displayName = 'AdvancedMediaEditor';
AdvancedMediaEditor.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default AdvancedMediaEditor;