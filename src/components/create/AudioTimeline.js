import React, { useRef, useEffect, useState } from 'react';
import styles from './AudioTimeline.module.css';
import { formatDuration } from '../../utils/formatDuration';

const AudioTimeline = ({
    duration,
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    label = "Audio Timing"
}) => {
    const timelineRef = useRef(null);
    const [isDraggingStart, setIsDraggingStart] = useState(false);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    const [isDraggingBar, setIsDraggingBar] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);

    // Default endTime to duration if null
    const effectiveEndTime = endTime !== null ? endTime : duration;

    const handleMouseDown = (e, type) => {
        e.stopPropagation();
        if (type === 'start') setIsDraggingStart(true);
        else if (type === 'end') setIsDraggingEnd(true);
        else if (type === 'bar') {
            setIsDraggingBar(true);
            const rect = timelineRef.current.getBoundingClientRect();
            const clickTime = ((e.clientX - rect.left) / rect.width) * duration;
            setDragOffset(clickTime - startTime);
        }
    };

    const handleMouseMove = (e) => {
        if (!timelineRef.current) return;
        if (!isDraggingStart && !isDraggingEnd && !isDraggingBar) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = percent * duration;

        if (isDraggingStart) {
            const newStart = Math.min(time, effectiveEndTime - 0.5);
            onStartTimeChange(Math.max(0, newStart));
        } else if (isDraggingEnd) {
            const newEnd = Math.max(time, startTime + 0.5);
            onEndTimeChange(Math.min(duration, newEnd));
        } else if (isDraggingBar) {
            const currentDuration = effectiveEndTime - startTime;
            let newStart = time - dragOffset;

            // Constrain within bounds
            if (newStart < 0) newStart = 0;
            if (newStart + currentDuration > duration) newStart = duration - currentDuration;

            onStartTimeChange(newStart);
            onEndTimeChange(newStart + currentDuration);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingStart(false);
        setIsDraggingEnd(false);
        setIsDraggingBar(false);
    };

    useEffect(() => {
        if (isDraggingStart || isDraggingEnd || isDraggingBar) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDraggingStart, isDraggingEnd, isDraggingBar]);

    const startPos = (startTime / duration) * 100;
    const endPos = (effectiveEndTime / duration) * 100;
    const width = endPos - startPos;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.label}>{label}</span>
                <div className={styles.times}>
                    <span>{formatDuration(startTime)}</span>
                    <span>-</span>
                    <span>{formatDuration(effectiveEndTime)}</span>
                </div>
            </div>

            <div ref={timelineRef} className={styles.timeline}>
                {/* Background track */}
                <div className={styles.track} />

                {/* Audio Bar */}
                <div
                    className={styles.audioBar}
                    style={{ left: `${startPos}%`, width: `${width}%` }}
                    onMouseDown={(e) => handleMouseDown(e, 'bar')}
                >
                    <div className={styles.waveformPattern} />

                    {/* Handles */}
                    <div
                        className={`${styles.handle} ${styles.handleStart}`}
                        onMouseDown={(e) => handleMouseDown(e, 'start')}
                    />
                    <div
                        className={`${styles.handle} ${styles.handleEnd}`}
                        onMouseDown={(e) => handleMouseDown(e, 'end')}
                    />
                </div>
            </div>
            <p className={styles.hint}>Drag the bar to move, or handles to trim</p>
        </div>
    );
};

export default AudioTimeline;
