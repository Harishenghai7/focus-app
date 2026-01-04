import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FOCUSLY_STICKERS, STICKER_CATEGORIES, getStickerUrl, searchStickers, filterStickersByCategory } from '../../data/focuslyStickerData';
import './StickerPicker.css';

const StickerPicker = ({ show, onClose, onSelect, recentStickers = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredStickers, setFilteredStickers] = useState(FOCUSLY_STICKERS);
  const [recentUsedStickers, setRecentUsedStickers] = useState(recentStickers);
  const [hoveredStickerId, setHoveredStickerId] = useState(null);
  const [visibleStickers, setVisibleStickers] = useState(12);
  const searchInputRef = useRef(null);
  const gridRef = useRef(null);
  const observerRef = useRef(null);

  // Load recently used stickers from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentFocuslyStickers');
    if (stored) {
      try {
        const recentIds = JSON.parse(stored);
        const recentStickerObjects = recentIds
          .map(id => FOCUSLY_STICKERS.find(s => s.id === id))
          .filter(Boolean);
        setRecentUsedStickers(recentStickerObjects);
      } catch (error) {
        console.error('Error loading recent stickers:', error);
      }
    }
  }, []);

  // Focus search input when picker opens
  useEffect(() => {
    if (show && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [show]);

  // Filter stickers based on search query and category
  useEffect(() => {
    let filtered = FOCUSLY_STICKERS;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchStickers(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(sticker => sticker.category === selectedCategory);
    }

    setFilteredStickers(filtered);
    setVisibleStickers(12);
  }, [searchQuery, selectedCategory]);

  // Handle sticker selection
  const handleStickerClick = useCallback((sticker) => {
    // Update recently used stickers
    const updatedRecent = [
      sticker,
      ...recentUsedStickers.filter(s => s.id !== sticker.id)
    ].slice(0, 10);

    setRecentUsedStickers(updatedRecent);

    // Save to localStorage
    const recentIds = updatedRecent.map(s => s.id);
    localStorage.setItem('recentFocuslyStickers', JSON.stringify(recentIds));

    // Call the callback
    if (onSelect) {
      onSelect(sticker);
    }
  }, [recentUsedStickers, onSelect]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  // Lazy loading observer
  useEffect(() => {
    if (!gridRef.current) return;

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleStickers < filteredStickers.length) {
        setVisibleStickers(prev => prev + 12);
      }
    });

    const sentinel = gridRef.current.querySelector('.sticker-grid-sentinel');
    if (sentinel) {
      observerRef.current.observe(sentinel);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleStickers, filteredStickers.length]);

  // Display stickers with recent at top
  const displayStickers = filteredStickers.slice(0, visibleStickers);

  if (!show) return null;

  return (
    <div className="sticker-picker-overlay" onClick={onClose}>
      <div className="sticker-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticker-picker-header">
          <h2 className="sticker-picker-title">Focusly Stickers</h2>
          <button className="sticker-picker-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="sticker-picker-search-container">
          <input
            ref={searchInputRef}
            type="text"
            className="sticker-picker-search"
            placeholder="Search stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search stickers"
          />
          {searchQuery && (
            <button
              className="sticker-picker-clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="sticker-picker-categories">
          {STICKER_CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`sticker-category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              title={category.name}
              aria-label={`Filter by ${category.name}`}
              aria-pressed={selectedCategory === category.id}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Recently Used Section */}
        {recentUsedStickers.length > 0 && searchQuery === '' && selectedCategory === 'all' && (
          <div className="sticker-picker-recent-section">
            <h3 className="recent-title">Recently Used</h3>
            <div className="sticker-grid recent-grid">
              {recentUsedStickers.map((sticker) => (
                <button
                  key={`recent-${sticker.id}`}
                  className="sticker-item"
                  onClick={() => handleStickerClick(sticker)}
                  onMouseEnter={() => setHoveredStickerId(sticker.id)}
                  onMouseLeave={() => setHoveredStickerId(null)}
                  title={sticker.name}
                  aria-label={`${sticker.name} sticker`}
                >
                  <img
                    src={getStickerUrl(sticker.fileName)}
                    alt={sticker.name}
                    className="sticker-image"
                    loading="lazy"
                  />
                  {hoveredStickerId === sticker.id && (
                    <div className="sticker-tooltip">{sticker.name}</div>
                  )}
                </button>
              ))}
            </div>
            <div className="sticker-divider"></div>
          </div>
        )}

        {/* Stickers Grid */}
        <div className="sticker-picker-content">
          {filteredStickers.length === 0 ? (
            <div className="sticker-picker-empty">
              <p>No stickers found</p>
            </div>
          ) : (
            <div className="sticker-grid" ref={gridRef}>
              {displayStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  className="sticker-item"
                  onClick={() => handleStickerClick(sticker)}
                  onMouseEnter={() => setHoveredStickerId(sticker.id)}
                  onMouseLeave={() => setHoveredStickerId(null)}
                  title={sticker.name}
                  aria-label={`${sticker.name} sticker`}
                >
                  <img
                    src={getStickerUrl(sticker.fileName)}
                    alt={sticker.name}
                    className="sticker-image"
                    loading="lazy"
                  />
                  {hoveredStickerId === sticker.id && (
                    <div className="sticker-tooltip">{sticker.name}</div>
                  )}
                </button>
              ))}
              <div className="sticker-grid-sentinel"></div>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {visibleStickers < filteredStickers.length && (
          <div className="sticker-picker-loading">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerPicker;
