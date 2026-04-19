import React from 'react';
import styles from './CategoryTabs.module.css';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: '🔥' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'posts', label: 'Posts', icon: '📸' },
    { id: 'boltz', label: 'Boltz', icon: '⚡' },
    { id: 'trending', label: 'Trending', icon: '📈' }
];

const CategoryTabs = ({ activeCategory = 'all', onCategoryChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                {CATEGORIES.map(category => (
                    <button
                        key={category.id}
                        className={`${styles.tab} ${activeCategory === category.id ? styles.active : ''}`}
                        onClick={() => onCategoryChange(category.id)}
                    >
                        <span className={styles.icon}>{category.icon}</span>
                        <span className={styles.label}>{category.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryTabs;
