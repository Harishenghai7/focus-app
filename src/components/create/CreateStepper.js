import React from 'react';
import styles from './CreateStepper.module.css';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = ['Media', 'Edit', 'Music', 'Details', 'Preview'];

const CreateStepper = ({ currentStep, completedSteps }) => {
    return (
        <div className={styles.sovereignStepper}>
            <div className={styles.glassBackdrop}>
                {STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(index);
                    const isActive = currentStep === index;

                    return (
                        <div key={step} className={styles.stepWrapper}>
                            <motion.div
                                className={`${styles.stepIndicator} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    boxShadow: isActive
                                        ? '0 0 30px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                        : isCompleted
                                            ? '0 0 20px rgba(139, 92, 246, 0.3)'
                                            : 'none'
                                }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {isCompleted ? (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Check size={16} className={styles.lavenderCheck} />
                                    </motion.div>
                                ) : (
                                    <span className={styles.stepNumber}>{index + 1}</span>
                                )}
                            </motion.div>

                            <motion.span
                                className={`${styles.label} ${isActive ? styles.activeLabel : ''} ${isCompleted ? styles.completedLabel : ''}`}
                                animate={{
                                    color: isActive
                                        ? '#a78bfa'
                                        : isCompleted
                                            ? '#c4b5fd'
                                            : '#64748b'
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                {step}
                            </motion.span>

                            {index < STEPS.length - 1 && (
                                <div className={styles.lineContainer}>
                                    <motion.div
                                        className={`${styles.line} ${isCompleted ? styles.completedLine : ''}`}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: isCompleted ? 1 : 0 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                                        style={{ originX: 0 }}
                                    />
                                    {isActive && !isCompleted && (
                                        <motion.div
                                            className={styles.pulseLine}
                                            animate={{
                                                opacity: [0.3, 0.6, 0.3],
                                                boxShadow: [
                                                    '0 0 5px rgba(139, 92, 246, 0.3)',
                                                    '0 0 15px rgba(139, 92, 246, 0.5)',
                                                    '0 0 5px rgba(139, 92, 246, 0.3)'
                                                ]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CreateStepper;
