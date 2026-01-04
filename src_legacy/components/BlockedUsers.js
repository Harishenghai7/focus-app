import React from 'react';
import PropTypes from 'prop-types';
import styles from './BlockedUsers.module.css';

/**
 * BlockedUsers
 * Manage blocked users list.
 * @param {Array<{username:string, avatar:string}>} users - Blocked users
 * @param {Function} onUnblock - Callback when unblock is clicked
 * @example <BlockedUsers users={[{username:'bob',avatar:'...'}]} onUnblock={handleUnblock} />
 */
const BlockedUsers = ({ users, onUnblock }) => (
  <div className={styles.container}>
    <h3 className={styles.title}>Blocked Users</h3>
    <ul className={styles.list}>
      {users.map(u => (
        <li key={u.username} className={styles.user}>
          <img src={u.avatar} alt={u.username} className={styles.avatar} />
          <span className={styles.username}>{u.username}</span>
          <button className={styles.unblockBtn} onClick={() => onUnblock(u.username)} aria-label={`Unblock ${u.username}`}>Unblock</button>
        </li>
      ))}
    </ul>
  </div>
);

BlockedUsers.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    username: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired
  })).isRequired,
  onUnblock: PropTypes.func.isRequired
};

export default React.memo(BlockedUsers);
