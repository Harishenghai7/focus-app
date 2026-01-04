import React from 'react';
import styles from './ExploreGrid.module.css';

const ExploreGrid = ({ children }) => {
    return (
        <div className={styles.grid}>
            {children}
        </div>
    );
};

export { default as ExploreTile } from './ExploreTile';
export default ExploreGrid;
