import React, { useState } from 'react';
import styles from './BoltzCaption.module.css';

const BoltzCaption = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    const maxLength = 100;
    const shouldTruncate = text.length > maxLength;

    return (
        <div className={styles.container}>
            <p className={styles.text}>
                {expanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`}
                {shouldTruncate && (
                    <button
                        className={styles.moreBtn}
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? ' less' : ' more'}
                    </button>
                )}
            </p>
        </div>
    );
};

export default BoltzCaption;
