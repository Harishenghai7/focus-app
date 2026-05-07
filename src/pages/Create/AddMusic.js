import React from 'react';
import styles from './AddMusic.module.css';
import MusicPicker from '../../components/create/MusicPicker';
import Button from '../../components/ui/Button';
import { ArrowLeft, ArrowRight, Music, X } from 'lucide-react';

const AddMusic = ({ selectedMusic, onSelect, onNext, onBack }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <h2>Add Music</h2>
                <Button onClick={onNext}>
                    {selectedMusic ? 'Next' : 'Skip'} <ArrowRight size={16} />
                </Button>
            </div>

            <div className={styles.content}>
                {selectedMusic && (selectedMusic.name || selectedMusic.artist_name) ? (
                    <div className={styles.selectedTrack}>
                        <div className={styles.trackIcon}>
                            <Music size={32} color="white" />
                        </div>
                        <div className={styles.trackInfo}>
                            <h3>{selectedMusic.name || 'Unknown Track'}</h3>
                            <p>{selectedMusic.artist_name || 'Unknown Artist'}</p>
                        </div>
                        <button className={styles.removeBtn} onClick={() => onSelect(null)}>
                            <X size={20} />
                        </button>
                    </div>
                ) : (
                    <div className={styles.placeholder}>
                        <p>Select a track to add to your post</p>
                    </div>
                )}

                <div className={styles.pickerWrapper}>
                    <MusicPicker onSelect={onSelect} />
                </div>
            </div>
        </div>
    );
};

export default AddMusic;
