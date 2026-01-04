import React, { useState } from 'react';
import styles from './ThumbnailSelector.module.css';
import Button from '../shared/Button';
import { Camera, Check } from 'lucide-react';
import { formatDuration } from '../../utils/formatDuration';

const ThumbnailSelector = ({
    videoRef,
    currentTime,
    getCurrentFilterString,
    onThumbnailSelect,
    selectedThumbnail
}) => {
    const [thumbnailTime, setThumbnailTime] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);

    const captureThumbnail = (time) => {
        const video = videoRef.current;
        if (!video) return;

        setIsCapturing(true);
        video.currentTime = time;

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            // Apply current filters to thumbnail
            ctx.filter = getCurrentFilterString();
            ctx.drawImage(video, 0, 0);

            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.9);
            onThumbnailSelect(thumbnailUrl);
            setThumbnailTime(time);
            setIsCapturing(false);
        };
    };

    return (
        <div className={styles.container}>
            <div className={styles.preview}>
                {selectedThumbnail ? (
                    <div className={styles.thumbnailWrapper}>
                        <img src={selectedThumbnail} alt="Video thumbnail" className={styles.thumbnail} />
                        <div className={styles.badge}>
                            <Check size={12} />
                            <span>Thumbnail Set</span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.placeholder}>
                        <Camera size={24} />
                        <span>No Thumbnail</span>
                    </div>
                )}
            </div>

            <div className={styles.controls}>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => captureThumbnail(currentTime)}
                    disabled={isCapturing}
                >
                    <Camera size={14} />
                    {isCapturing ? 'Capturing...' : 'Use Current Frame'}
                </Button>
                {selectedThumbnail && (
                    <span className={styles.timestamp}>
                        at {formatDuration(thumbnailTime)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ThumbnailSelector;
