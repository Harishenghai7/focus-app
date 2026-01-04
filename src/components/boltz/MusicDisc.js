import React from 'react';
import styles from './MusicDisc.module.css';

const MusicDisc = ({ imageUrl, playing, onClick }) => {
    return (
        <div
            className={`${styles.disc} ${playing ? styles.spinning : ''}`}
            onClick={onClick}
        >
            {imageUrl ? (
                <img src={imageUrl} alt="Music" className={styles.image} />
            ) : (
                <div className={styles.placeholder}>🎵</div>
            )}
        </div>
    );
};

export default MusicDisc;
