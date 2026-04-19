import React from 'react';
import styles from './NotificationsTabs.module.css';

const NotificationsTabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className={styles.tabs} role="tablist">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    role="tab"
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    aria-selected={activeTab === tab.id}
                    aria-label={`${tab.label} notifications`}
                >
                    {tab.label}
                    {tab.count > 0 && (
                        <span className={styles.tabBadge}>
                            {tab.count > 99 ? '99+' : tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default NotificationsTabs;
