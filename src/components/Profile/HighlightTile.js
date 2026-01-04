import React from 'react';
import styles from './HighlightTile.module.css';

const HighlightTile = ({ highlight, onClick }) => {
    return (
        <button className={styles.tile} onClick={onClick} aria-label={`View ${highlight.title} highlight`}>
            <div className={styles.cover}>
                {highlight.cover_url ? (
                    <img src={highlight.cover_url} alt={highlight.title} className={styles.image} />
                ) : (
                    <div className={styles.placeholder}>
                        {highlight.title.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <span className={styles.title}>{highlight.title}</span>
        </button>
    );
};

export default HighlightTile;
