import React from 'react';
import styles from './ExploreEmptyState.module.css';
import { Search } from 'lucide-react';

const ExploreEmptyState = ({ query }) => {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <Search size={48} />
            </div>
            <h3 className={styles.title}>No results found</h3>
            <p className={styles.description}>
                We couldn't find anything matching "{query}". Try searching for something else or explore trending creators.
            </p>
        </div>
    );
};

export default ExploreEmptyState;
