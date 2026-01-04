import React, { useRef, useState } from 'react';
import styles from './MusicPicker.module.css';
import { useJamendo } from '../../hooks/useJamendo';
import Input from '../shared/Input';
import LoadingSpinner from '../shared/LoadingSpinner';
import { Play, Pause, Plus, Upload, Music } from 'lucide-react';
import Button from '../shared/Button';

const CATEGORIES = ['All', 'Pop', 'Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Classical', 'Chill', 'Indie'];

const MusicPicker = ({ onSelect }) => {
    const fileInputRef = useRef(null);
    const [activeCategory, setActiveCategory] = useState('All');

    const {
        tracks,
        loading,
        error,
        search,
        filterByCategory,
        currentTrack,
        isPlaying,
        playPreview,
        stopPlayback,
        searchQuery
    } = useJamendo();

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        filterByCategory(category);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onSelect({
                id: 'local-' + Date.now(),
                name: file.name.replace(/\.[^/.]+$/, ""),
                artist_name: 'Original Audio',
                audio: url,
                isLocal: true,
                file: file
            });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.topBar}>
                    <div className={styles.searchBar}>
                        <Input
                            placeholder="Search Jamendo Library..."
                            value={searchQuery}
                            onChange={(e) => search(e.target.value)}
                        />
                    </div>
                    <div className={styles.uploadSection}>
                        <input
                            type="file"
                            accept="audio/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                        <Button variant="secondary" onClick={() => fileInputRef.current.click()}>
                            <Upload size={16} /> Upload Own
                        </Button>
                    </div>
                </div>

                <div className={styles.categories}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`${styles.categoryBtn} ${activeCategory === cat ? styles.activeCategory : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.trackList}>
                {loading ? (
                    <div className={styles.loader}>
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <div className={styles.error}>{error}</div>
                ) : tracks.length === 0 ? (
                    <div className={styles.emptyState}>No tracks found</div>
                ) : (
                    tracks.map(track => (
                        <div key={track.id} className={styles.trackItem}>
                            <div className={styles.trackImage}>
                                {track.image ? (
                                    <img src={track.image} alt={track.name} />
                                ) : (
                                    <div className={styles.placeholderIcon}>
                                        <Music size={20} />
                                    </div>
                                )}
                                <div
                                    className={styles.playOverlay}
                                    onClick={() => {
                                        if (currentTrack?.id === track.id && isPlaying) {
                                            // Stop playing
                                            stopPlayback();
                                        } else {
                                            // Play this track
                                            playPreview(track);
                                        }
                                    }}
                                >
                                    {currentTrack?.id === track.id && isPlaying ? (
                                        <Pause size={16} fill="white" />
                                    ) : (
                                        <Play size={16} fill="white" />
                                    )}
                                </div>
                            </div>

                            <div className={styles.trackInfo}>
                                <span className={styles.trackName}>{track.name}</span>
                                <span className={styles.artistName}>{track.artist_name}</span>
                            </div>

                            <button
                                className={styles.addButton}
                                onClick={() => {
                                    stopPlayback(); // Stop any playing preview
                                    onSelect(track);
                                }}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MusicPicker;
