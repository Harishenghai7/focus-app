import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ currentStep, totalSteps, stepLabel, title, description, progressPercentage, emotionalCopy, stepColor }) => {
    const progress = progressPercentage ?? Math.round((currentStep / totalSteps) * 100);

    return (
        <div className={styles.container}>
            <div className={styles.metaRow}>
                <div className={styles.copyBlock}>
                    <div className={styles.kickerRow}>
                        <span className={styles.kicker}>{stepLabel}</span>
                        {emotionalCopy && (
                            <span className={styles.emotionalCopy}>{emotionalCopy}</span>
                        )}
                    </div>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.description}>{description}</p>
                </div>

                <div className={styles.progressBadge} style={{ '--badge-color': stepColor || '#a78bfa' }}>
                    <span className={styles.progressNumber}>{progress}%</span>
                    <span className={styles.progressCaption}>Complete</span>
                </div>
            </div>

            {/* Segmented progress bar */}
            <div className={styles.segmentTrack}>
                {Array.from({ length: totalSteps }, (_, i) => {
                    const isFilled = i < currentStep;
                    const isCurrent = i === currentStep - 1;
                    return (
                        <div
                            key={i}
                            className={`${styles.segment} ${isFilled ? styles.segmentFilled : ''} ${isCurrent ? styles.segmentCurrent : ''}`}
                            style={{
                                '--seg-color': stepColor || '#a78bfa',
                                animationDelay: `${i * 0.06}s`
                            }}
                        />
                    );
                })}
            </div>

            <div className={styles.info}>
                <span className={styles.step}>Step {currentStep} of {totalSteps}</span>
                <span className={styles.percentage}>Focus is tailoring trust, safety, and personalization to you.</span>
            </div>
        </div>
    );
};

export default ProgressBar;
