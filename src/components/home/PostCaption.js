import React, { useState } from 'react';
import styles from './PostCaption.module.css';
import { linkifyText } from '../../utils/linkifyText';
import { formatNumber } from '../../utils/formatNumber';

const PostCaption = ({ username, caption, likesCount }) => {
    const [expanded, setExpanded] = useState(false);
    const MAX_LENGTH = 100;

    const shouldTruncate = caption && caption.length > MAX_LENGTH;
    const displayCaption = expanded || !shouldTruncate ? caption : caption.slice(0, MAX_LENGTH) + '...';

    return (
        <div className={styles.container}>
            <div className={styles.likes}>
                {formatNumber(likesCount)} likes
            </div>

            <div className={styles.caption}>
                <span className={styles.username}>{username}</span>
                <span className={styles.text}>
                    {linkifyText(displayCaption, styles.link)}
                </span>
                {shouldTruncate && !expanded && (
                    <button className={styles.moreBtn} onClick={() => setExpanded(true)}>
                        more
                    </button>
                )}
            </div>

            <button className={styles.translateBtn} onClick={() => { }}>
                See Translation
            </button>
        </div>
    );
};

export default PostCaption;
