import React, { useState, useRef } from 'react';
import styles from './TrendingSection.module.css';
import Icon from '../ui/Icon';
import TrendingHashtags from './TrendingHashtags';
import { useTrending } from '../../hooks/useTrending';
import { useJamendo } from '../../hooks/useJamendo';

const TrendingSection = () => {
    const { trendingHashtags, loading: hashtagsLoading } = useTrending();
    const { tracks: trendingAudio, loading: audioLoading } = useJamendo();
    const [playingId, setPlayingId] = useState(null);
    const audioRef = useRef(null);

    // Limit to top 3 audio tracks
    const displayAudio = trendingAudio.slice(0, 3);

    const handlePlayAudio = (audio) => {
        if (!audioRef.current) return;

        if (playingId === audio.id) {
            // Pause if already playing
            audioRef.current.pause();
            setPlayingId(null);
        } else {
            // Play new audio
            audioRef.current.src = audio.audio;
            audioRef.current.play();
            setPlayingId(audio.id);
        }
    };

    const handleAudioEnded = () => {
        setPlayingId(null);
    };

    if (hashtagsLoading && audioLoading) {
        return null; // Or a loading skeleton
    }

    return (
        <div className={styles.container}>
            {trendingHashtags && trendingHashtags.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.header}>
                        <h3>Trending Hashtags</h3>
                        <button className={styles.seeAll}>See All</button>
                    </div>
                    <TrendingHashtags hashtags={trendingHashtags} />
                </div>
            )}

            {displayAudio && displayAudio.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.header}>
                        <h3>Trending Audio</h3>
                        <button className={styles.seeAll}>See All</button>
                    </div>
                    <div className={styles.audioList}>
                        {displayAudio.map(audio => (
                            <div
                                key={audio.id}
                                className={styles.audioCard}
                                onClick={() => handlePlayAudio(audio)}
                                style={{ cursor: 'pointer' }}
                            >
                                <button className={styles.playButton}>
                                    <Icon
                                        name={playingId === audio.id ? "Pause" : "Play"}
                                        size={16}
                                        color="white"
                                    />
                                </button>
                                <div className={styles.audioIcon}>
                                    <Icon name="Music" size={20} color="white" />
                                </div>
                                <div className={styles.audioInfo}>
                                    <span className={styles.audioName}>{audio.name}</span>
                                    <span className={styles.audioArtist}>{audio.artist_name}</span>
                                </div>
                                <Icon name="ChevronRight" size={16} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </div>
                    {/* Hidden audio element for playback */}
                    <audio
                        ref={audioRef}
                        onEnded={handleAudioEnded}
                        style={{ display: 'none' }}
                    />
                </div>
            )}
        </div>
    );
};

export default TrendingSection;
