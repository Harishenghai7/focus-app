import React from 'react';
import PropTypes from 'prop-types';
import styles from './TrendingSection.module.css';

/**
 * TrendingSection
 * Trending hashtags/topics widget.
 * @param {Array<string>} hashtags - Trending hashtags/topics
 * @param {Function} onSelect - Callback when hashtag/topic is selected
 * @example <TrendingSection hashtags={["focus","react"]} onSelect={handleSelect} />
 */
const TrendingSection = ({ hashtags, onSelect }) => (
  <div className={styles.container}>
    <h3 className={styles.title}>Trending</h3>
    <ul className={styles.list}>
      {(hashtags || []).map(h => (
        <li key={h}>
          <button className={styles.hashtag} onClick={() => onSelect(h)} aria-label={`Select trending ${h}`}>#{h}</button>
        </li>
      ))}
    </ul>
  </div>
);

TrendingSection.propTypes = {
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired
};

export default React.memo(TrendingSection);
