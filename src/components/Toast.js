import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Toast.module.css';

/**
 * Toast
 * Global toast notification system with auto-dismiss.
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info, warning)
 * @param {number} duration - Duration in ms before auto-dismiss
 * @param {Function} onClose - Callback when toast closes
 * @example <Toast message="Saved!" type="success" duration={3000} onClose={handleClose} />
 */
const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert" aria-live="assertive">
      <span>{message}</span>
      <button className={styles.close} onClick={handleClose} aria-label="Close notification">×</button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
  duration: PropTypes.number,
  onClose: PropTypes.func
};

export default React.memo(Toast);
