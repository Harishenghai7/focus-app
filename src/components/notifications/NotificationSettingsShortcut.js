import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationSettingsShortcut.module.css';
import Icon from '../ui/Icon';

const NotificationSettingsShortcut = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/settings?section=notifications');
    };

    return (
        <button
            className={styles.button}
            onClick={handleClick}
            aria-label="Notification settings"
            title="Notification settings"
        >
            <Icon name="Settings" size={20} />
        </button>
    );
};

export default NotificationSettingsShortcut;
