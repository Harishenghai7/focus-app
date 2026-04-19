import React from 'react';
import styles from './FocuslyButton.module.css';
import focuslyIcon from '../../assets/focusly/focusly_reference.png';

const FocuslyButton = ({ onClick, notificationCount }) => {
    return (
        <button className={styles.button} onClick={onClick} aria-label="Open Focusly AI">
            <div className={styles.iconWrapper}>
                <img src={focuslyIcon} alt="Focusly AI" className={styles.icon} />
            </div>
            <div className={styles.glow} />
            {notificationCount > 0 && (
                <span className={styles.badge}>{notificationCount}</span>
            )}
        </button>
    );
};

export default FocuslyButton;
