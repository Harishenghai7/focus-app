import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ currentStep, totalSteps, stepLabel, title, description, progressPercentage }) => {
    const progress = progressPercentage ?? Math.round((currentStep / totalSteps) * 100);

    return (
        <div className={styles.container}>
            <div className={styles.metaRow}>
                <div className={styles.copyBlock}>
                    <span className={styles.kicker}>{stepLabel}</span>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.description}>{description}</p>
                </div>

                <div className={styles.progressBadge}>
                    <span className={styles.progressNumber}>{progress}%</span>
                    <span className={styles.progressCaption}>Complete</span>
                </div>
            </div>

            <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${progress}%` }} />
            </div>

            <div className={styles.info}>
                <span className={styles.step}>Step {currentStep} of {totalSteps}</span>
                <span className={styles.percentage}>Focus is tailoring trust, safety, and personalization to you.</span>
            </div>
        </div>
    );
};

export default ProgressBar;
