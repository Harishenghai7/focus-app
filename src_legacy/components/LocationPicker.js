import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './LocationPicker.module.css';

/**
 * LocationPicker
 * Map-based location selector.
 * @param {Function} onSelect - Callback with selected location
 * @example <LocationPicker onSelect={handleLocation} />
 */
const mockLocations = [
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6895, lng: 139.6917 },
];

const LocationPicker = ({ onSelect }) => {
  const [selected, setSelected] = useState(null);

  const handleSelect = loc => {
    setSelected(loc);
    if (onSelect) onSelect(loc);
  };

  return (
    <div className={styles.container}>
      <div className={styles.map} aria-label="Map placeholder">
        {/* Placeholder for map integration */}
        <span role="img" aria-label="Map">🗺️</span>
      </div>
      <ul className={styles.list}>
        {mockLocations.map(loc => (
          <li key={loc.name}>
            <button
              className={selected === loc ? styles.selected : styles.location}
              onClick={() => handleSelect(loc)}
              aria-label={`Select ${loc.name}`}
            >
              {loc.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

LocationPicker.propTypes = {
  onSelect: PropTypes.func.isRequired
};

export default React.memo(LocationPicker);
