import React, { useRef, useEffect, useState } from 'react';
import styles from './VideoTimeline.module.css';
import { formatDuration } from '../../utils/formatDuration';
import { Clock } from 'lucide-react';

const VideoTimeline = ({
    videoRef,
    duration,
    currentTime,
    trimRange,
    onTrimChange,
    onSeek
}) => {
    const timelineRef = useRef(null);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [isDraggingStart, setIsDraggingStart] = useState(false);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    const [thumbnails, setThumbnails] = useState([]);
    const [startInput, setStartInput] = useState('');
    const [endInput, setEndInput] = useState('');

    // Update inputs when trimRange changes
    useEffect(() => {
        setStartInput(formatDuration(trimRange[0]));
        setEndInput(formatDuration(trimRange[1]));
    }, [trimRange]);

    // Generate thumbnails when video is loaded
    useEffect(() => {
        if (!videoRef?.current || !duration) return;

        const generateThumbnails = async () => {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const thumbCount = 10;
            const thumbs = [];

            canvas.width = 120;
            canvas.height = 67;

            for (let i = 0; i < thumbCount; i++) {
                const time = (duration / thumbCount) * i;
                video.currentTime = time;

                await new Promise(resolve => {
                    video.onseeked = () => {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        thumbs.push({
                            time,
                            url: canvas.toDataURL('image/jpeg', 0.7)
                        });
                        resolve();
                    };
                });
            }

            setThumbnails(thumbs);
        };

        generateThumbnails().catch(console.error);
    }, [videoRef, duration]);

    const parseTimeInput = (input) => {
        // Parse formats: "1:23", "0:05", "23" (seconds only)
        const parts = input.split(':').map(p => parseInt(p.trim(), 10));
        if (parts.length === 1) {
            return parts[0] || 0; // Seconds only
        } else if (parts.length === 2) {
            return (parts[0] * 60) + (parts[1] || 0); // Minutes:Seconds
        }
        return 0;
    };

    const handleStartTimeChange = (e) => {
        const value = e.target.value;
        setStartInput(value);
    };

    const handleEndTimeChange = (e) => {
        const value = e.target.value;
        setEndInput(value);
    };

    const handleStartTimeBlur = () => {
        const time = parseTimeInput(startInput);
        const clampedTime = Math.max(0, Math.min(time, trimRange[1] - 0.1, duration));
        onTrimChange([clampedTime, trimRange[1]]);
        setStartInput(formatDuration(clampedTime));
    };

    const handleEndTimeBlur = () => {
        const time = parseTimeInput(endInput);
        const clampedTime = Math.max(trimRange[0] + 0.1, Math.min(time, duration));
        onTrimChange([trimRange[0], clampedTime]);
        setEndInput(formatDuration(clampedTime));
    };

    const handleMouseDown = (e, type) => {
        e.stopPropagation();
        if (type === 'playhead') setIsDraggingPlayhead(true);
        else if (type === 'start') setIsDraggingStart(true);
        else if (type === 'end') setIsDraggingEnd(true);
    };

    const handleMouseMove = (e) => {
        if (!timelineRef.current) return;
        if (!isDraggingPlayhead && !isDraggingStart && !isDraggingEnd) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = percent * duration;

        if (isDraggingPlayhead) {
            onSeek(time);
        } else if (isDraggingStart) {
            onTrimChange([Math.min(time, trimRange[1] - 0.1), trimRange[1]]);
        } else if (isDraggingEnd) {
            onTrimChange([trimRange[0], Math.max(time, trimRange[0] + 0.1)]);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingPlayhead(false);
        setIsDraggingStart(false);
        setIsDraggingEnd(false);
    };

    useEffect(() => {
        if (isDraggingPlayhead || isDraggingStart || isDraggingEnd) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDraggingPlayhead, isDraggingStart, isDraggingEnd, trimRange]);

    const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
    const trimStartPosition = duration > 0 ? (trimRange[0] / duration) * 100 : 0;
    const trimEndPosition = duration > 0 ? (trimRange[1] / duration) * 100 : 100;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.timeDisplay}>
                    <span className={styles.currentTime}>{formatDuration(currentTime)}</span>
                    <span className={styles.separator}>/</span>
                    <span className={styles.totalTime}>{formatDuration(duration)}</span>
                </div>

                <div className={styles.manualInputs}>
                    <div className={styles.inputGroup}>
                        <label>
                            <Clock size={14} />
                            <span>Start</span>
                        </label>
                        <input
                            type="text"
                            value={startInput}
                            onChange={handleStartTimeChange}
                            onBlur={handleStartTimeBlur}
                            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                            placeholder="0:00"
                            className={styles.timeInput}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>
                            <Clock size={14} />
                            <span>End</span>
                        </label>
                        <input
                            type="text"
                            value={endInput}
                            onChange={handleEndTimeChange}
                            onBlur={handleEndTimeBlur}
                            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                            placeholder="0:00"
                            className={styles.timeInput}
                        />
                    </div>
                </div>
            </div>

            <div
                ref={timelineRef}
                className={styles.timeline}
                onClick={(e) => {
                    const rect = timelineRef.current.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    onSeek(percent * duration);
                }}
            >
                {/* Thumbnail strip */}
                <div className={styles.thumbnailStrip}>
                    {thumbnails.map((thumb, i) => (
                        <div key={i} className={styles.thumbnail}>
                            <img src={thumb.url} alt={`Frame at ${formatDuration(thumb.time)}`} />
                        </div>
                    ))}
                </div>

                {/* Timeline track */}
                <div className={styles.track}>
                    {/* Dimmed regions outside trim */}
                    <div
                        className={styles.dimmedRegion}
                        style={{ left: 0, width: `${trimStartPosition}%` }}
                    />
                    <div
                        className={styles.dimmedRegion}
                        style={{ left: `${trimEndPosition}%`, width: `${100 - trimEndPosition}%` }}
                    />

                    {/* Active trim region */}
                    <div
                        className={styles.activeRegion}
                        style={{
                            left: `${trimStartPosition}%`,
                            width: `${trimEndPosition - trimStartPosition}%`
                        }}
                    />

                    {/* Trim handles */}
                    <div
                        className={`${styles.trimHandle} ${styles.trimHandleStart}`}
                        style={{ left: `${trimStartPosition}%` }}
                        onMouseDown={(e) => handleMouseDown(e, 'start')}
                    >
                        <div className={styles.trimHandleBar} />
                    </div>
                    <div
                        className={`${styles.trimHandle} ${styles.trimHandleEnd}`}
                        style={{ left: `${trimEndPosition}%` }}
                        onMouseDown={(e) => handleMouseDown(e, 'end')}
                    >
                        <div className={styles.trimHandleBar} />
                    </div>

                    {/* Playhead */}
                    <div
                        className={styles.playhead}
                        style={{ left: `${playheadPosition}%` }}
                        onMouseDown={(e) => handleMouseDown(e, 'playhead')}
                    >
                        <div className={styles.playheadLine} />
                        <div className={styles.playheadHandle} />
                    </div>
                </div>

                {/* Time markers */}
                <div className={styles.timeMarkers}>
                    {Array.from({ length: 11 }, (_, i) => {
                        const time = (duration / 10) * i;
                        return (
                            <div key={i} className={styles.timeMarker} style={{ left: `${i * 10}%` }}>
                                <div className={styles.markerTick} />
                                <span className={styles.markerLabel}>{formatDuration(time)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.trimInfo}>
                <span className={styles.trimLabel}>Selected Duration:</span>
                <span className={styles.trimDuration}>{formatDuration(trimRange[1] - trimRange[0])}</span>
            </div>
        </div>
    );
};

export default VideoTimeline;
