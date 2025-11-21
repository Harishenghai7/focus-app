import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './ContextMenu.module.css';

/**
 * ContextMenu
 * Right-click/long-press context menu.
 * @param {Array<{label: string, onClick: Function}>} options - Menu options
 * @param {React.ReactNode} children - Element to wrap
 * @example <ContextMenu options={[{label: 'Edit', onClick: editFn}]}><div>...</div></ContextMenu>
 */
const ContextMenu = ({ options, children }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = () => setVisible(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = e => {
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  };

  return (
    <div className={styles.wrapper} onContextMenu={handleContextMenu}>
      {children}
      {visible && (
        <ul
          className={styles.menu}
          style={{ top: pos.y, left: pos.x }}
          ref={menuRef}
          role="menu"
        >
          {options.map((opt, i) => (
            <li key={i} className={styles.item} onClick={opt.onClick} role="menuitem" tabIndex={0} aria-label={opt.label}>{opt.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

ContextMenu.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  })).isRequired,
  children: PropTypes.node.isRequired
};

export default React.memo(ContextMenu);
