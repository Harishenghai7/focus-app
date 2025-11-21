import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Tooltip.module.css';

/**
 * Tooltip
 * Contextual tooltip with hover/click.
 * @param {React.ReactNode} children - Element to wrap
 * @param {string} text - Tooltip text
 * @param {string} position - top, right, bottom, left
 * @example <Tooltip text="Info" position="top">Hover me</Tooltip>
 */
const Tooltip = ({ children, text, position = 'top' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-label={text}
    >
      {children}
      {visible && (
        <span className={`${styles.tooltip} ${styles[position]}`} role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['top','right','bottom','left'])
};

export default React.memo(Tooltip);
