import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './HashtagInput.module.css';

/**
 * HashtagInput
 * #hashtag autocomplete with trending suggestions.
 * @param {Array<string>} trending - Trending hashtags
 * @param {Function} onSelect - Callback when hashtag is selected
 * @example <HashtagInput trending={["focus","react"]} onSelect={handleHashtag} />
 */
const HashtagInput = ({ trending, onSelect }) => {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = e => {
    const val = e.target.value;
    setValue(val);
    if (val.includes('#')) {
      const query = val.split('#').pop();
      setSuggestions(trending.filter(h => h.startsWith(query) && query.length > 0));
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = hashtag => {
    setValue(v => v.replace(/#\w*$/, `#${hashtag} `));
    setSuggestions([]);
    if (onSelect) onSelect(hashtag);
  };

  return (
    <div className={styles.container}>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Type # for hashtag..."
        aria-label="Hashtag input"
      />
      {suggestions.length > 0 && (
        <ul className={styles.suggestions} role="listbox">
          {suggestions.map(h => (
            <li key={h} className={styles.suggestion} onClick={() => handleSelect(h)} role="option" tabIndex={0} aria-label={`Hashtag ${h}`}>#{h}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

HashtagInput.propTypes = {
  trending: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired
};

export default React.memo(HashtagInput);
