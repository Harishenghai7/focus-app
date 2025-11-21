import React from 'react';
import PropTypes from 'prop-types';
import styles from './ConfirmDialog.module.css';

/**
 * ConfirmDialog
 * Modal confirmation dialog for confirming destructive actions.
 * @param {boolean} open - Whether the dialog is open
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} onConfirm - Callback for confirm
 * @param {Function} onCancel - Callback for cancel
 * @param {boolean} destructive - Whether this is a destructive action (red button)
 * @param {string} confirmLabel - Custom label for confirm button
 * @param {string} cancelLabel - Custom label for cancel button
 * @example <ConfirmDialog open={isOpen} title="Delete Post?" message="Are you sure you want to delete this post?" onConfirm={handleDelete} onCancel={handleCancel} destructive />
 */
const ConfirmDialog = ({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  destructive = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel'
}) => {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div className={styles.dialog}>
        <h2 id="dialog-title" className={styles.title}>{title}</h2>
        <p id="dialog-message" className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button 
            className={styles.cancel} 
            onClick={onCancel} 
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button 
            className={destructive ? styles.confirmDestructive : styles.confirm} 
            onClick={onConfirm} 
            aria-label={confirmLabel}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  destructive: PropTypes.bool,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string
};

export default React.memo(ConfirmDialog);
