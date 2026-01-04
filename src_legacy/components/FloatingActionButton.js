import React from 'react';
import PropTypes from 'prop-types';
import styles from './FloatingActionButton.module.css';

/**
 * FloatingActionButton
 * Material Design FAB with ripple.
 * @param {Function} onClick - Callback for button click
 * @param {React.ReactNode} icon - Icon to display
 * @param {string} label - ARIA label
 * @example <FloatingActionButton onClick={handleClick} icon={<AddIcon />} label="Add" />
 */
const FloatingActionButton = ({ onClick, icon, label, className }) => (
  <button 
    className={`${styles.fab} ${className || ''}`} 
    onClick={onClick} 
    aria-label={label}
    data-testid="create-post-button"
    id="create-post-fab"
  >
    {icon}
    <span className={styles.ripple} />
  </button>
);

FloatingActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default React.memo(FloatingActionButton);
