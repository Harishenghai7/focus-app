/**
 * LocationPicker Component
 * Search and select locations for posts
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import './LocationPicker.css';

const LocationPicker = ({ value, onChange, onClose }) => {
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Load recent locations from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentLocations') || '[]');
    setRecentLocations(recent.slice(0, 5));
  }, []);

  // Search locations
  useEffect(() => {
    if (!query) {
      setLocations([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Search in existing post locations
        const { data, error } = await supabase
          .from('posts')
          .select('location')
          .not('location', 'is', null)
          .ilike('location', `%${query}%`)
          .limit(20);

        if (error) throw error;

        // Get unique locations
        const uniqueLocations = [...new Set(data.map(p => p.location))];
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error searching locations:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSelect = (location) => {
    onChange(location);
    
    // Save to recent locations
    const recent = [
      location,
      ...recentLocations.filter(l => l !== location)
    ].slice(0, 5);
    
    setRecentLocations(recent);
    localStorage.setItem('recentLocations', JSON.stringify(recent));
    
    if (onClose) {
      onClose();
    }
  };

  const handleRemoveLocation = () => {
    onChange(null);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="location-picker">
      <div className="location-picker-header">
        <h3>Add Location</h3>
        <button
          className="location-picker-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="location-search">
        <span className="location-search-icon">📍</span>
        <input
          type="text"
          className="location-search-input"
          placeholder="Search locations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            className="location-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Current Location */}
      {value && (
        <div className="location-current">
          <div className="location-current-info">
            <span className="location-current-icon">✓</span>
            <span className="location-current-text">{value}</span>
          </div>
          <button
            className="location-current-remove"
            onClick={handleRemoveLocation}
            aria-label="Remove location"
          >
            Remove
          </button>
        </div>
      )}

      {/* Results or Recent */}
      <div className="location-results">
        {loading ? (
          <div className="location-loading">
            <div className="location-loading-spinner"></div>
            <p>Searching locations...</p>
          </div>
        ) : query ? (
          locations.length > 0 ? (
            <div className="location-section">
              <h4 className="location-section-title">Results</h4>
              {locations.map((location, index) => (
                <div
                  key={index}
                  className="location-item"
                  onClick={() => handleSelect(location)}
                >
                  <span className="location-item-icon">📍</span>
                  <span className="location-item-text">{location}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="location-empty">
              <span className="location-empty-icon">🔍</span>
              <p>No locations found</p>
              <p className="location-empty-subtitle">
                Try a different search term
              </p>
              <button
                className="location-empty-action"
                onClick={() => handleSelect(query)}
              >
                Use "{query}"
              </button>
            </div>
          )
        ) : recentLocations.length > 0 ? (
          <div className="location-section">
            <h4 className="location-section-title">Recent Locations</h4>
            {recentLocations.map((location, index) => (
              <div
                key={index}
                className="location-item"
                onClick={() => handleSelect(location)}
              >
                <span className="location-item-icon">🕒</span>
                <span className="location-item-text">{location}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="location-empty">
            <span className="location-empty-icon">📍</span>
            <p>No recent locations</p>
            <p className="location-empty-subtitle">
              Search for a location to add it to your post
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
