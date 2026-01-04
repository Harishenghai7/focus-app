import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './CoverPhotoEditor.module.css';

/**
 * CoverPhotoEditor
 * Edit cover photo with drag-to-position.
 * @param {string} src - Cover photo URL
 * @param {Function} onSave - Callback with new position
 * @example <CoverPhotoEditor src="..." onSave={handleSave} />
 */
const CoverPhotoEditor = ({ src, onSave }) => {
  const [offset, setOffset] = useState(0);
  const handleDrag = e => {
    setOffset(o => o + e.movementY);
  };
  const handleSave = () => {
    if (onSave) onSave(offset);
  };
  return (
    <div className={styles.container}>
      <div
        className={styles.photoWrapper}
        draggable
        onDrag={handleDrag}
        aria-label="Drag to reposition cover photo"
      >
        <img src={src} alt="Cover" className={styles.photo} style={{ top: offset }} />
      </div>
      <button className={styles.saveBtn} onClick={handleSave} aria-label="Save cover photo">Save</button>
    </div>
  );
};

CoverPhotoEditor.propTypes = {
  src: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired
};

export default React.memo(CoverPhotoEditor);
