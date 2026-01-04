import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './AvatarEditor.module.css';

/**
 * AvatarEditor
 * Edit profile picture with filters and effects.
 * @param {string} src - Avatar image URL
 * @param {Array<string>} filters - List of filter names
 * @param {Function} onSave - Callback with edited image
 * @example <AvatarEditor src="..." filters={["Normal","Sepia"]} onSave={handleSave} />
 */
const AvatarEditor = ({ src, filters, onSave }) => {
  const [selected, setSelected] = useState(filters[0]);

  const handleSave = () => {
    if (onSave) onSave(src, selected);
  };

  return (
    <div className={styles.container}>
      <img src={src} alt="Avatar" className={`${styles.avatar} ${styles[selected]}`} />
      <div className={styles.filters}>
        {filters.map(f => (
          <button
            key={f}
            className={selected === f ? styles.selected : styles.filter}
            onClick={() => setSelected(f)}
            aria-label={`Apply filter ${f}`}
          >
            {f}
          </button>
        ))}
      </div>
      <button className={styles.saveBtn} onClick={handleSave} aria-label="Save avatar">Save</button>
    </div>
  );
};

AvatarEditor.propTypes = {
  src: PropTypes.string.isRequired,
  filters: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSave: PropTypes.func.isRequired
};

export default React.memo(AvatarEditor);
