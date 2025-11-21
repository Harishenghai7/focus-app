import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './BottomSheet.module.css';

/**
 * BottomSheet
 * Mobile bottom drawer with drag handle.
 * @param {boolean} open - Whether the sheet is open
 * @param {Function} onClose - Callback to close
 * @param {React.ReactNode} children - Content inside sheet
 * @example <BottomSheet open={isOpen} onClose={closeFn}>...</BottomSheet>
 */
const BottomSheet = ({ open, onClose, children }) => {
  const [dragging, setDragging] = useState(false);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.sheet}>
        <div
          className={styles.handle}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          aria-label="Drag handle"
        />
        <button className={styles.close} onClick={onClose} aria-label="Close sheet">×</button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

BottomSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node
};

export default React.memo(BottomSheet);
