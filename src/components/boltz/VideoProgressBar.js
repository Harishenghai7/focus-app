import React from 'react';
import styles from './VideoProgressBar.module.css';

const VideoProgressBar = ({ progress }) => {
    return (
        <div className={styles.container}>
            <div
                className={styles.progress}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

export default VideoProgressBar;
