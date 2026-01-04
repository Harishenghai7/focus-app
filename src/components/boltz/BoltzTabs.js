import React from 'react';
import styles from './BoltzTabs.module.css';

const BoltzTabs = ({ activeTab, onTabChange }) => {
    return (
        <div className={styles.container}>
            <button
                className={`${styles.tab} ${activeTab === 'foryou' ? styles.active : ''}`}
                onClick={() => onTabChange('foryou')}
            >
                For You
            </button>
            <button
                className={`${styles.tab} ${activeTab === 'following' ? styles.active : ''}`}
                onClick={() => onTabChange('following')}
            >
                Following
            </button>
        </div>
    );
};

export default BoltzTabs;
