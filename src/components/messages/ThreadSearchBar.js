import React, { useState } from 'react';
import styles from './ThreadSearchBar.module.css';

const ThreadSearchBar = ({ onSearch, placeholder = 'Search messages...' }) => {
    const [query, setQuery] = useState('');

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    };

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
                <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder={placeholder}
                    value={query}
                    onChange={handleChange}
                    aria-label="Search conversations"
                />
                {query && (
                    <button
                        className={styles.clearButton}
                        onClick={handleClear}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default ThreadSearchBar;
