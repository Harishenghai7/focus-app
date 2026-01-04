import React from 'react';
import styles from './UserInfoModal.module.css';
import Avatar from '../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

const UserInfoModal = ({ user, onClose }) => {
    if (!user) return null;

    const lastSeenText = user.is_online
        ? 'Online now'
        : user.last_seen
            ? `Last seen ${formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}`
            : 'Last seen recently';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>User Info</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    <div className={styles.avatarSection}>
                        <Avatar
                            src={user.avatar_url}
                            size="xl"
                            status={user.is_online ? 'online' : 'offline'}
                        />
                    </div>

                    <div className={styles.infoSection}>
                        <div className={styles.infoItem}>
                            <label>Username</label>
                            <p>{user.username || 'Unknown'}</p>
                        </div>

                        {user.full_name && (
                            <div className={styles.infoItem}>
                                <label>Full Name</label>
                                <p>{user.full_name}</p>
                            </div>
                        )}

                        {user.bio && (
                            <div className={styles.infoItem}>
                                <label>Bio</label>
                                <p>{user.bio}</p>
                            </div>
                        )}

                        <div className={styles.infoItem}>
                            <label>Status</label>
                            <p className={user.is_online ? styles.online : styles.offline}>
                                {lastSeenText}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfoModal;
