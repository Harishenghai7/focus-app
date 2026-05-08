import React from 'react';
import styles from './VideoProgressBar.module.css';

const VideoProgressBar = ({ progress = 0, buffered = 0 }) => (
    <div className={styles.container}>
        <div className={styles.track}>
            <div className={styles.buffered} style={{ width: `${buffered}%` }} />
            <div className={styles.fill} style={{ width: `${progress}%` }}>
                <div className={styles.glow} />
                <div className={styles.head} />
            </div>
        </div>
    </div>
);

export default VideoProgressBar;
