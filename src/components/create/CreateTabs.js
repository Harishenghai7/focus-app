import React from 'react';
import styles from './CreateTabs.module.css';
import { Image, Video, Zap } from 'lucide-react';

const TABS = [
    { id: 'post', label: 'Post', icon: Image },
    { id: 'boltz', label: 'Boltz', icon: Video },
    { id: 'flash', label: 'Flash', icon: Zap },
];

const CreateTabs = ({ activeTab, onTabChange }) => {
    return (
        <div className={styles.container}>
            {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <Icon size={20} />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default CreateTabs;
