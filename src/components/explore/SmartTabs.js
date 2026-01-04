// SmartTabs - Enhanced Tab Navigation
import React from 'react';
import styles from './SmartTabs.module.css';

const tabs = [
    { id: 'all', label: 'All', icon: '🌐' },
    { id: 'posts', label: 'Posts', icon: '📸' },
    { id: 'boltz', label: 'Boltz', icon: '⚡' },
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'tags', label: 'Tags', icon: '#️⃣' },
    { id: 'trending', label: 'Trending', icon: '📈' }
];

const SmartTabs = ({ activeTab, onTabChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.tabsWrapper}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <span className={styles.icon}>{tab.icon}</span>
                        <span className={styles.label}>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SmartTabs;
