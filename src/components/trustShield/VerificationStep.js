import React from 'react';
import { FaCheck, FaChevronRight } from 'react-icons/fa';
import styles from './VerificationStep.module.css';

const VerificationStep = ({ step, loading }) => {
    const isCompleted = step.status === 'completed';

    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <step.icon size={20} color="var(--primary)" />
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{step.title}</h3>
                    <span className={styles.points}>+{step.points} pts</span>
                </div>
                <p className={styles.description}>{step.description}</p>
            </div>

            <div className={styles.action}>
                {isCompleted ? (
                    <span className={styles.completed}>
                        <FaCheck size={14} /> Verified
                    </span>
                ) : (
                    <button
                        onClick={step.action}
                        disabled={loading}
                        className={styles.button}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                        {!loading && <FaChevronRight size={12} style={{ marginLeft: '6px' }} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VerificationStep;
