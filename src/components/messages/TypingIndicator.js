import React from 'react';
import styles from './TypingIndicator.module.css';
import Avatar from '../ui/Avatar';

const TypingIndicator = ({ username, avatarUrl, users = [] }) => {
    // Handle both single user and multiple users
    const displayText = users.length > 0
        ? users.length === 1
            ? `${users[0].username} is typing...`
            : users.length === 2
                ? `${users[0].username} and ${users[1].username} are typing...`
                : `${users[0].username} and ${users.length - 1} others are typing...`
        : username
            ? `${username} is typing...`
            : 'Typing...';

    const displayAvatar = users.length > 0 ? users[0].avatar_url : avatarUrl;

    return (
        <div className={styles.typingIndicator}>
            {displayAvatar && (
                <Avatar
                    src={displayAvatar}
                    size="sm"
                    className={styles.avatar}
                />
            )}
            <div className={styles.bubbleContainer}>
                <div className={styles.bubble}>
                    <div className={styles.dots}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                    </div>
                </div>
                <span className={styles.text}>{displayText}</span>
            </div>
        </div>
    );
};

export default TypingIndicator;
