import React from 'react';
import styles from './CreateStepper.module.css';
import { Check } from 'lucide-react';

const STEPS = ['Media', 'Edit', 'Details', 'Preview'];

const CreateStepper = ({ currentStep, completedSteps }) => {
    return (
        <div className={styles.container}>
            {STEPS.map((step, index) => {
                const isCompleted = completedSteps.includes(index);
                const isActive = currentStep === index;

                return (
                    <div key={step} className={styles.stepWrapper}>
                        <div
                            className={`${styles.stepIndicator} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                        >
                            {isCompleted ? <Check size={16} /> : index + 1}
                        </div>
                        <span className={`${styles.label} ${isActive ? styles.activeLabel : ''}`}>
                            {step}
                        </span>
                        {index < STEPS.length - 1 && (
                            <div className={`${styles.line} ${isCompleted ? styles.completedLine : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CreateStepper;
