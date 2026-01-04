import React from 'react';
import PropTypes from 'prop-types';
import styles from './BadgeCount.module.css';

/**
 * BadgeCount Component
 * Displays badge count with icon
 */
const BadgeCount = ({ count, showIcon = true, size = 'md' }) => {
    const text = count === 0 ? 'No badges' : count === 1 ? '1 badge' : `${count} badges`;

    return (
        <div className={`${styles.badgeCount} ${styles[size]}`}>
            {showIcon && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
            <span className={styles.text}>{text}</span>
        </div>
    );
};

BadgeCount.propTypes = {
    count: PropTypes.number.isRequired,
    showIcon: PropTypes.bool,
    size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default BadgeCount;
