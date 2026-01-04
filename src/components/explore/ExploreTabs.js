import React from 'react';
import styles from './ExploreTabs.module.css';

const TABS = [
    'All', 'Trending', 'Posts', 'Boltz', 'Users'
];

const ExploreTabs = ({ activeTab, onTabChange }) => {
    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsScroll}>
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                        onClick={() => onTabChange(tab)}
                        aria-selected={activeTab === tab}
                        role="tab"
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ExploreTabs;
