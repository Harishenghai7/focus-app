import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './LanguageSwitcher.module.css';

/**
 * LanguageSwitcher
 * Multi-language selector dropdown.
 * @param {Array<string>} languages - List of language codes
 * @param {Function} onSwitch - Callback with selected language
 * @example <LanguageSwitcher languages={["en","es"]} onSwitch={handleSwitch} />
 */
const LanguageSwitcher = ({ languages, onSwitch }) => {
  const [selected, setSelected] = useState(languages[0]);
  const handleSwitch = lang => {
    setSelected(lang);
    if (onSwitch) onSwitch(lang);
  };
  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={selected}
        onChange={e => handleSwitch(e.target.value)}
        aria-label="Select language"
      >
        {languages.map(l => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
    </div>
  );
};

LanguageSwitcher.propTypes = {
  languages: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSwitch: PropTypes.func.isRequired
};

export default React.memo(LanguageSwitcher);
