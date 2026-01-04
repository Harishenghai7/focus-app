import React from 'react';
import styles from './AudioTimelineControl.module.css';
import { formatDuration } from '../../utils/formatDuration';

const AudioTimelineControl = ({
    duration,
    audioStartTime,
    audioEndTime,
    onStartTimeChange,
    onEndTimeChange
}) => {
    return (
        <div className={styles.container}>
            <h4 className={styles.title}>Audio Timeline</h4>
            <p className={styles.description}>
                Set when the audio track should start and end in your video timeline.
            </p>

            <div className={styles.controls}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Start Time</label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="number"
                            min="0"
                            max={duration}
                            step="0.1"
                            value={audioStartTime.toFixed(1)}
                            onChange={(e) => onStartTimeChange(Math.max(0, Math.min(parseFloat(e.target.value), duration)))}
                            className={styles.numberInput}
                        />
                        <span className={styles.unit}> seconds</span>
                        <span className={styles.formatted}>{formatDuration(audioStartTime)}</span>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>End Time <span>(optional)</span></label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="number"
                            min={audioStartTime}
                            max={duration}
                            step="0.1"
                            value={audioEndTime !== null ? audioEndTime.toFixed(1) : ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                    onEndTimeChange(null);
                                } else {
                                    onEndTimeChange(Math.max(audioStartTime, Math.min(parseFloat(value), duration)));
                                }
                            }}
                            placeholder="End of video"
                            className={styles.numberInput}
                        />
                        <span className={styles.unit}>seconds</span>
                        {audioEndTime && <span className={styles.formatted}>{formatDuration(audioEndTime)}</span>}
                    </div>
                </div>
            </div>

            <div className={styles.visualTimeline}>
                <div className={styles.timelineTrack}>
                    <div
                        className={styles.audioRange}
                        style={{
                            left: `${(audioStartTime / duration) * 100}%`,
                            width: `${((audioEndTime !== null ? audioEndTime : duration) - audioStartTime) / duration * 100}%`
                        }}
                    />
                </div>
                <div className={styles.timelineLabels}>
                    <span>0:00</span>
                    <span>{formatDuration(duration)}</span>
                </div>
            </div>
        </div>
    );
};

export default AudioTimelineControl;
