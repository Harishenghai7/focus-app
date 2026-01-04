import React from 'react';
import styles from './SilentModeToggle.module.css';

const SilentModeToggle = ({ isSilent, onToggle }) => {
    return (
        <button
            className={`${styles.toggle} ${isSilent ? styles.active : ''}`}
            onClick={onToggle}
            title={isSilent ? 'Silent mode ON' : 'Silent mode OFF'}
        >
            {isSilent ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M8 6L4 10H2v4h2l4 4V6zM14 10l3-3M14 10l3 3M14 10l-3-3M14 10l-3 3"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M8 6L4 10H2v4h2l4 4V6zM14 7a5 5 0 0 1 0 10M16 5a8 8 0 0 1 0 14"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )}
        </button>
    );
};

export default SilentModeToggle;
