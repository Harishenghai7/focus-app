import React from 'react';
import styles from './BoltzMusicInfo.module.css';
import { Music } from 'lucide-react';

const BoltzMusicInfo = ({ music, playing, onClick }) => {
    if (!music) return null;

    return (
        <div className={styles.container} onClick={onClick}>
            <Music size={16} className={`${styles.musicIcon} ${playing ? styles.playing : ''}`} />
            <div className={styles.musicDetails}>
                <div className={styles.musicName}>
                    {music.name || 'Unknown Track'}
                </div>
                {music.artist && (
                    <div className={styles.artistName}>
                        {music.artist}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoltzMusicInfo;
