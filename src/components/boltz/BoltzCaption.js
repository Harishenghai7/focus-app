import React, { useState } from 'react';
import styles from './BoltzCaption.module.css';

const MAX_CHARS = 100;

const BoltzCaption = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;

    const isLong = text.length > MAX_CHARS;
    const display = expanded || !isLong ? text : text.slice(0, MAX_CHARS);

    // Highlight hashtags
    const rendered = display.split(/(#[a-zA-Z0-9_]+)/g).map((part, i) =>
        part.startsWith('#') ? <span key={i} className={styles.hashtag}>{part}</span> : part
    );

    return (
        <p className={styles.caption}>
            {rendered}
            {isLong && !expanded && (
                <button className={styles.moreBtn} onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
                    ... more
                </button>
            )}
        </p>
    );
};

export default BoltzCaption;
