import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './ThemeSwitcher.module.css';

/**
 * ThemeSwitcher
 * Toggle between light/dark/custom themes.
 * @param {Array<string>} themes - List of theme names
 * @param {Function} onSwitch - Callback with selected theme
 * @example <ThemeSwitcher themes={["Light","Dark"]} onSwitch={handleSwitch} />
 */
const ThemeSwitcher = ({ themes, onSwitch }) => {
  const [selected, setSelected] = useState(themes[0]);
  const handleSwitch = theme => {
    setSelected(theme);
    if (onSwitch) onSwitch(theme);
  };
  return (
    <div className={styles.container}>
      {(themes || []).map(t => (
        <button
          key={t}
          className={selected === t ? styles.selected : styles.theme}
          onClick={() => handleSwitch(t)}
          aria-label={`Switch to ${t} theme`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

ThemeSwitcher.propTypes = {
  themes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSwitch: PropTypes.func.isRequired
};

export default React.memo(ThemeSwitcher);
