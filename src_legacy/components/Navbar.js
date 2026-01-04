/**
 * Navbar Component
 *
 * Top navigation bar for the Focus app. Displays the app logo and main navigation links.
 *
 * @component
 * @example
 * <Navbar user={currentUser} />
 *
 * @param {Object} user - Current user
 * @returns {React.ReactElement} Navigation bar
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import './Navbar.css';

const Navbar = React.memo(function Navbar({ user }) {
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Top navigation">
      <button className={styles.logoBtn} onClick={() => navigate('/')} aria-label="Go to home">
        <span className={styles.logoText}>Focus</span>
      </button>
      {/* ...add more navigation links as needed... */}
    </nav>
  );
});

Navbar.propTypes = {
  user: PropTypes.object
};

Navbar.defaultProps = {
  user: null
};

Navbar.displayName = 'Navbar';

export default Navbar;