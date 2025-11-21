import React from 'react';
import PropTypes from 'prop-types';
import styles from './SessionManager.module.css';

/**
 * SessionManager
 * View and logout active sessions.
 * @param {Array<{device:string, lastActive:string}>} sessions - List of sessions
 * @param {Function} onLogout - Callback with device name
 * @example <SessionManager sessions={[{device:'iPhone',lastActive:'2h ago'}]} onLogout={handleLogout} />
 */
const SessionManager = ({ sessions, onLogout }) => (
  <div className={styles.container}>
    <h3 className={styles.title}>Active Sessions</h3>
    <ul className={styles.list}>
      {sessions.map(s => (
        <li key={s.device} className={styles.session}>
          <span className={styles.device}>{s.device}</span>
          <span className={styles.lastActive}>{s.lastActive}</span>
          <button className={styles.logoutBtn} onClick={() => onLogout(s.device)} aria-label={`Logout from ${s.device}`}>Logout</button>
        </li>
      ))}
    </ul>
  </div>
);

SessionManager.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.shape({
    device: PropTypes.string.isRequired,
    lastActive: PropTypes.string.isRequired
  })).isRequired,
  onLogout: PropTypes.func.isRequired
};

export default React.memo(SessionManager);
