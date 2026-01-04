import React from 'react';
import { X } from 'lucide-react';
import styles from './UserProfileModal.module.css';
import Avatar from '../shared/Avatar';

const UserProfileModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.header}>
                    <div className={styles.cover} />
                    <div className={styles.avatarWrapper}>
                        <Avatar src={user.avatar_url} size="xl" className={styles.avatar} />
                    </div>
                </div>

                <div className={styles.content}>
                    <h2 className={styles.username}>@{user.username}</h2>
                    <p className={styles.fullName}>{user.full_name}</p>

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>1.2k</span>
                            <span className={styles.statLabel}>Followers</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>500</span>
                            <span className={styles.statLabel}>Following</span>
                        </div>
                    </div>

                    <button className={styles.followButton}>Follow</button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
