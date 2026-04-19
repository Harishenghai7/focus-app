import React from 'react';
import Icon from '../ui/Icon';
import styles from './EmptyState.module.css';

const EmptyState = ({ icon = 'Inbox', message = 'Nothing here yet', action }) => {
    return (
        <div className={styles.emptyState}>
            <div className={styles.mascot}>
                <div className={styles.mascotOrb}>F</div>
                <span className={styles.mascotLabel}>FocuslyMascot</span>
            </div>
            <div className={styles.iconContainer}>
                <Icon name={icon} size={48} className={styles.icon} />
            </div>
            <p className={styles.message}>{message}</p>
            {action && (
                <button className={styles.action} onClick={action.onClick}>
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
