import React from 'react';
import styles from './NotificationsTabs.module.css';

const NotificationsTabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.tabsWrapper}>
                <div className={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                            onClick={() => onTabChange(tab.id)}
                            aria-label={`${tab.label} notifications`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            <span className={styles.label}>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={styles.badge} aria-label={`${tab.count} unread`}>
                                    {tab.count > 99 ? '99+' : tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div
                    className={styles.indicator}
                    style={{
                        transform: `translateX(${getIndicatorPosition(tabs, activeTab)}px)`,
                        width: `${getIndicatorWidth(tabs, activeTab)}px`
                    }}
                />
            </div>
        </div>
    );
};

// Helper to calculate indicator position
const getIndicatorPosition = (tabs, activeTab) => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeIndex === -1) return 0;

    // Approximate calculation - will be refined with CSS
    return activeIndex * 100;
};

// Helper to calculate indicator width
const getIndicatorWidth = (tabs, activeTab) => {
    // Approximate - will be refined with CSS
    return 80;
};

export default NotificationsTabs;
