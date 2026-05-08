import React from 'react';
import styles from './BoltzTabs.module.css';

const TABS = [
  { key: 'foryou', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
  { key: 'learning', label: 'Learning' },
];

const BoltzTabs = ({ activeTab, onTabChange }) => (
    <div className={styles.container}>
        <div className={styles.tabs}>
            {TABS.map(tab => (
                <button
                    key={tab.key}
                    className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.key)}
                >
                    {tab.label}
                    {activeTab === tab.key && <div className={styles.indicator} />}
                </button>
            ))}
        </div>
    </div>
);

export default BoltzTabs;
