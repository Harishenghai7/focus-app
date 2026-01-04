import React, { useEffect } from 'react';
import styles from './Toast.module.css';

const Toast = ({ message, type = 'info', onClose = () => { }, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            {message}
        </div>
    );
};

export default Toast;
