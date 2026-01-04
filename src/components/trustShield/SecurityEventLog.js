import React from 'react';
import { FaSignInAlt, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import styles from './SecurityEventLog.module.css';

const SecurityEventLog = ({ limit = 5 }) => {
    // Mock events
    const events = [
        { id: 1, type: 'login', message: 'New login from Chrome on Windows', date: '2 mins ago', icon: FaSignInAlt, color: '#3b82f6' },
        { id: 2, type: 'trust', message: 'Trust score increased to 75', date: '1 day ago', icon: FaShieldAlt, color: '#22c55e' },
        { id: 3, type: 'alert', message: 'Suspicious login attempt blocked', date: '3 days ago', icon: FaExclamationTriangle, color: '#ef4444' },
    ];

    return (
        <div className={styles.container}>
            {events.slice(0, limit).map(event => (
                <div key={event.id} className={styles.item}>
                    <div
                        className={styles.iconWrapper}
                        style={{ background: `${event.color}20` }}
                    >
                        <event.icon size={14} color={event.color} />
                    </div>
                    <div className={styles.content}>
                        <p className={styles.message}>{event.message}</p>
                        <span className={styles.date}>{event.date}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SecurityEventLog;
