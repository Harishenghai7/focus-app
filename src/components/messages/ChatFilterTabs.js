import React from 'react';
import styles from './ChatFilterTabs.module.css';

const ChatFilterTabs = ({ activeFilter, onFilterChange, counts }) => {
    const filters = [
        { id: 'all', label: 'All', icon: '💬' },
        { id: 'unread', label: 'Unread', icon: '🔴', count: counts?.unread },
        { id: 'groups', label: 'Groups', icon: '👥', count: counts?.groups },
        { id: 'personal', label: 'Personal', icon: '👤' }
    ];

    return (
        <div className={styles.tabs}>
            {filters.map(filter => (
                <button
                    key={filter.id}
                    className={`${styles.tab} ${activeFilter === filter.id ? styles.active : ''}`}
                    onClick={() => onFilterChange(filter.id)}
                >
                    <span className={styles.icon}>{filter.icon}</span>
                    <span className={styles.label}>{filter.label}</span>
                    {filter.count > 0 && (
                        <span className={styles.badge}>{filter.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default ChatFilterTabs;
