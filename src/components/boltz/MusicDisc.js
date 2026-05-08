import React from 'react';
import styles from './MusicDisc.module.css';

const MusicDisc = ({ imageUrl, playing, onClick }) => (
    <button className={`${styles.disc} ${playing ? styles.spinning : ''}`} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
        <div className={styles.inner}>
            {imageUrl ? (
                <img src={imageUrl} alt="" className={styles.coverArt} />
            ) : (
                <div className={styles.defaultCover}>🎵</div>
            )}
        </div>
        <div className={styles.groove1} />
        <div className={styles.groove2} />
    </button>
);

export default MusicDisc;
