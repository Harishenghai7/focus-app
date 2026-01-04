import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './FilterSelector.module.css';

/**
 * FilterSelector
 * Instagram-style image/video filter selector.
 * @param {Array<string>} filters - List of filter names
 * @param {Function} onSelect - Callback when filter is selected
 * @example <FilterSelector filters={["Normal","Sepia","Mono"]} onSelect={handleFilter} />
 */
const FilterSelector = ({ filters, onSelect }) => {
  const [selected, setSelected] = useState(filters[0]);

  const handleSelect = filter => {
    setSelected(filter);
    if (onSelect) onSelect(filter);
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        {filters.map(f => (
          <button
            key={f}
            className={selected === f ? styles.selected : styles.filter}
            onClick={() => handleSelect(f)}
            aria-label={`Select filter ${f}`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
};

FilterSelector.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired
};

export default React.memo(FilterSelector);
