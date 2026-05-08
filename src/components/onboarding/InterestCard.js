import React from 'react';
import styles from './InterestCard.module.css';
import { FaCheck } from 'react-icons/fa';

const InterestCard = ({ label, emoji, selected, onClick, color }) => {
    return (
        <button
            className={`${styles.card} ${selected ? styles.selected : ''}`}
            onClick={onClick}
            style={{ '--interest-color': color || '#a78bfa' }}
            type="button"
        >
            <span className={styles.emoji}>{emoji}</span>
            <span className={styles.label}>{label}</span>
            {selected && (
                <span className={styles.check}>
                    <FaCheck />
                </span>
            )}
            <span className={styles.ripple} />
        </button>
    );
};

export default InterestCard;
