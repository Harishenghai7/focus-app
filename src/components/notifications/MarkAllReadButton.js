import React from 'react';
import styles from './MarkAllReadButton.module.css';
import Icon from '../ui/Icon';

const MarkAllReadButton = ({ onClick, disabled, loading }) => {
    return (
        <button
            className={`${styles.button} ${disabled ? styles.disabled : ''} ${loading ? styles.loading : ''}`}
            onClick={onClick}
            disabled={disabled || loading}
            aria-label="Mark all notifications as read"
        >
            <Icon name="CheckCheck" size={18} />
            <span>Mark all read</span>
        </button>
    );
};

export default MarkAllReadButton;
