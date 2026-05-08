import React from 'react';
import styles from './PollCreator.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Plus, X, Clock } from 'lucide-react';

const DURATIONS = [
    { value: '24h', label: '24 hours' },
    { value: '3d', label: '3 days' },
    { value: '7d', label: '7 days' },
];

const PollCreator = ({ poll, onUpdatePoll }) => {
    const { enabled, question, options, duration } = poll;

    const togglePoll = () => onUpdatePoll({ enabled: !enabled });

    const updateQuestion = (value) => onUpdatePoll({ question: value });

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        onUpdatePoll({ options: newOptions });
    };

    const addOption = () => {
        if (options.length < 4) {
            onUpdatePoll({ options: [...options, ''] });
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            onUpdatePoll({ options: options.filter((_, i) => i !== index) });
        }
    };

    return (
        <div className={styles.container}>
            {/* Toggle */}
            <button className={styles.toggleRow} onClick={togglePoll}>
                <div className={styles.toggleInfo}>
                    <BarChart3 size={18} />
                    <span className={styles.toggleLabel}>Add Poll</span>
                </div>
                <div className={`${styles.toggle} ${enabled ? styles.on : ''}`}>
                    <div className={styles.thumb} />
                </div>
            </button>

            {/* Poll form */}
            <AnimatePresence>
                {enabled && (
                    <motion.div
                        className={styles.pollForm}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Question */}
                        <input
                            value={question}
                            onChange={(e) => updateQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            className={styles.questionInput}
                            maxLength={140}
                        />

                        {/* Options */}
                        <div className={styles.optionsList}>
                            {options.map((opt, i) => (
                                <motion.div
                                    key={i}
                                    className={styles.optionRow}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <span className={styles.optionNum}>{i + 1}</span>
                                    <input
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                        className={styles.optionInput}
                                        maxLength={50}
                                    />
                                    {options.length > 2 && (
                                        <button className={styles.removeOptBtn} onClick={() => removeOption(i)}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {options.length < 4 && (
                            <button className={styles.addOptBtn} onClick={addOption}>
                                <Plus size={16} /> Add Option
                            </button>
                        )}

                        {/* Duration */}
                        <div className={styles.durationSection}>
                            <Clock size={14} />
                            <span className={styles.durationLabel}>Poll Duration</span>
                            <div className={styles.durationBtns}>
                                {DURATIONS.map(d => (
                                    <button
                                        key={d.value}
                                        className={`${styles.durBtn} ${duration === d.value ? styles.durActive : ''}`}
                                        onClick={() => onUpdatePoll({ duration: d.value })}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        {question && options.some(o => o.trim()) && (
                            <div className={styles.pollPreview}>
                                <span className={styles.previewLabel}>Preview</span>
                                <div className={styles.previewCard}>
                                    <p className={styles.previewQuestion}>{question}</p>
                                    {options.filter(o => o.trim()).map((opt, i) => (
                                        <div key={i} className={styles.previewOption}>
                                            <span>{opt}</span>
                                            <div className={styles.previewBar} style={{ width: `${20 + Math.random() * 60}%` }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PollCreator;
