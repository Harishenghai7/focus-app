import React from 'react';
import styles from './NewMessageButton.module.css';

const NewMessageButton = ({ onClick }) => {
    return (
        <button
            className={styles.newMessageButton}
            onClick={onClick}
            aria-label="New message"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 20.29V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7.961a2 2 0 0 0-1.561.75l-2.331 2.914A.6.6 0 0 1 3 20.29z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 9v6m3-3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>New Message</span>
        </button>
    );
};

export default NewMessageButton;
