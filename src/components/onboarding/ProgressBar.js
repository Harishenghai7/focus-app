import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ currentStep, totalSteps }) => {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className={styles.container}>
            <div className={styles.track}>
                <div
                    className={styles.fill}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className={styles.text}>
                Step {currentStep} of {totalSteps}
            </span>
        </div>
    );
};

export default ProgressBar;
