import React from 'react';
import styles from './Avatar.module.css';

const Avatar = ({ src, alt, size = 'md', hasStories = false, className = '' }) => {
    return (
        <div className={`${styles.avatar} ${styles[size]} ${hasStories ? styles.hasStories : ''} ${className}`}>
            {src ? (
                <img src={src} alt={alt || 'User avatar'} className={styles.image} />
            ) : (
                <div className={styles.placeholder}>
                    {(alt || 'U').charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    );
};

export default Avatar;

