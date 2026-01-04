import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './EmojiPicker.module.css';

/**
 * EmojiPicker
 * Custom emoji picker with categories and search.
 * @param {Function} onSelect - Callback when emoji is selected
 * @example <EmojiPicker onSelect={handleEmoji} />
 */
const emojiCategories = {
  Smileys: ['😀','😂','😍','😎','😭','😡'],
  Animals: ['🐶','🐱','🦁','🐮','🐸','🐵'],
  Food: ['🍎','🍔','🍕','🍣','🍦','🍩'],
  Activities: ['⚽','🏀','🏈','🎾','🏓','🏸'],
};

const EmojiPicker = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Smileys');

  const emojis = emojiCategories[category].filter(e => e.includes(search));

  return (
    <div className={styles.container}>
      <input
        className={styles.search}
        type="text"
        placeholder="Search emojis..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search emojis"
      />
      <div className={styles.categories}>
        {Object.keys(emojiCategories).map(cat => (
          <button
            key={cat}
            className={category === cat ? styles.selected : styles.category}
            onClick={() => setCategory(cat)}
            aria-label={`Show ${cat} emojis`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {emojis.map((emoji, i) => (
          <button
            key={i}
            className={styles.emoji}
            onClick={() => onSelect(emoji)}
            aria-label={`Select emoji ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

EmojiPicker.propTypes = {
  onSelect: PropTypes.func.isRequired
};

export default React.memo(EmojiPicker);
