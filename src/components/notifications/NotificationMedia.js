import React from 'react';
import styles from './NotificationMedia.module.css';

const NotificationMedia = ({ src, alt, contentType }) => {
    if (!src) return null;

    return (
        <div className={styles.mediaWrapper}>
            <img
                src={src}
                alt={alt || 'Preview'}
                className={styles.media}
                loading="lazy"
            />
            {contentType === 'boltz' && (
                <div className={styles.videoBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default NotificationMedia;
