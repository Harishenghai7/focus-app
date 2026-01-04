import React, { useState } from 'react';
import { useFocuslyAI } from '../../hooks/useFocuslyAI';
import styles from './TranslateButton.module.css';

const TranslateButton = ({ text, onTranslated }) => {
    const [translated, setTranslated] = useState(null);
    const [showing, setShowing] = useState(false);
    const { processing, translateMessage } = useFocuslyAI();

    const handleTranslate = async () => {
        if (!translated) {
            const result = await translateMessage(text, 'en');
            setTranslated(result);
        }
        setShowing(!showing);
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.button}
                onClick={handleTranslate}
                disabled={processing}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h6M5 2v2M3 8c1 2 2 3 4 3M7 8l-2 3M10 4l3 8M11 10h4"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {processing ? 'Translating...' : showing ? 'Show Original' : 'Translate'}
            </button>
            {showing && translated && (
                <div className={styles.translation}>
                    <span className={styles.label}>Translation:</span>
                    <p>{translated}</p>
                </div>
            )}
        </div>
    );
};

export default TranslateButton;
