import React from 'react';
import styles from './BoltzMusicInfo.module.css';
import { Music } from 'lucide-react';

const BoltzMusicInfo = ({ music, playing, onClick }) => {
    if (!music) return null;
    const trackName = music.title || music.name || 'Original Sound';

    return (
        <button className={styles.container} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            <Music size={12} className={styles.icon} />
            <div className={styles.marqueeContainer}>
                <span className={`${styles.trackName} ${playing ? styles.scrolling : ''}`}>
                    {trackName} • {trackName}
                </span>
            </div>
        </button>
    );
};

export default BoltzMusicInfo;
