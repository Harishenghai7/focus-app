import React from 'react';
import HighlightTile from './HighlightTile';
import Icon from '../ui/Icon';
import styles from './HighlightCarousel.module.css';

const HighlightCarousel = ({ highlights, isOwnProfile, onHighlightClick, onAddClick }) => {
    if (!highlights || highlights.length === 0) {
        if (!isOwnProfile) return null;

        return (
            <div className={styles.carousel}>
                <button className={styles.addButton} onClick={onAddClick} aria-label="Add highlight">
                    <div className={styles.addIcon}>
                        <Icon name="Plus" size={32} />
                    </div>
                    <span className={styles.addLabel}>New</span>
                </button>
            </div>
        );
    }

    return (
        <div className={styles.carousel}>
            <div className={styles.scrollContainer}>
                {highlights.map((highlight) => (
                    <HighlightTile
                        key={highlight.id}
                        highlight={highlight}
                        onClick={() => onHighlightClick(highlight)}
                    />
                ))}
                {isOwnProfile && (
                    <button className={styles.addButton} onClick={onAddClick} aria-label="Add highlight">
                        <div className={styles.addIcon}>
                            <Icon name="Plus" size={32} />
                        </div>
                        <span className={styles.addLabel}>New</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default HighlightCarousel;
