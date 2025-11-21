import React from 'react';
import PropTypes from 'prop-types';
import styles from './MutedUsers.module.css';

/**
 * MutedUsers
 * Manage muted users list.
 * @param {Array<{username:string, avatar:string}>} users - Muted users
 * @param {Function} onUnmute - Callback when unmute is clicked
 * @example <MutedUsers users={[{username:'alice',avatar:'...'}]} onUnmute={handleUnmute} />
 */
const MutedUsers = ({ users, onUnmute }) => (
  <div className={styles.container}>
    <h3 className={styles.title}>Muted Users</h3>
    <ul className={styles.list}>
      {users.map(u => (
        <li key={u.username} className={styles.user}>
          <img src={u.avatar} alt={u.username} className={styles.avatar} />
          <span className={styles.username}>{u.username}</span>
          <button className={styles.unmuteBtn} onClick={() => onUnmute(u.username)} aria-label={`Unmute ${u.username}`}>Unmute</button>
        </li>
      ))}
    </ul>
  </div>
);

MutedUsers.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    username: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired
  })).isRequired,
  onUnmute: PropTypes.func.isRequired
};

export default React.memo(MutedUsers);
