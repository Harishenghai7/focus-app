import React from 'react';
import styles from './InterestCard.module.css';
import { FaCheck } from 'react-icons/fa';

const InterestCard = ({ label, emoji, selected, onClick }) => {
    return (
        <div
            className={`${styles.card} ${selected ? styles.selected : ''}`}
            onClick={onClick}
        >
            <div className={styles.emoji}>{emoji}</div>
            <span className={styles.label}>{label}</span>
            {selected && (
                <div className={styles.check}>
                    <FaCheck />
                </div>
            )}
        </div>
    );
};

export default InterestCard;
