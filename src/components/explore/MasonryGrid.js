// MasonryGrid - Pinterest-Style Layout
import React from 'react';
import styles from './MasonryGrid.module.css';

const MasonryGrid = ({ children, columns = 3, gap = 4 }) => {
    return (
        <div
            className={styles.grid}
            style={{
                '--columns': columns,
                '--gap': `${gap}px`
            }}
        >
            {children}
        </div>
    );
};

export default MasonryGrid;
