import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';
import styles from './ProfileTabs.module.css';

const TABS = [
    { id: 'posts', label: 'Posts', icon: 'Grid3x3' },
    { id: 'boltz', label: 'Boltz', icon: 'Video' },
    { id: 'saved', label: 'Saved', icon: 'Bookmark' },
    { id: 'tagged', label: 'Tagged', icon: 'UserCheck' }
];

const ProfileTabs = ({ activeTab, onTabChange, availableTabs }) => {
    const visibleTabs = TABS.filter(tab => availableTabs.includes(tab.id));

    return (
        <div className={styles.tabs}>
            {visibleTabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    aria-label={tab.label}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="profile-tab-pill"
                            className={styles.activePill}
                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        />
                    )}
                    <Icon name={tab.icon} size={20} />
                    <span className={styles.label}>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ProfileTabs;
