import React, { useState } from 'react';
import { useGroupPolls } from '../../hooks/useGroupPolls';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import styles from './PollCreator.module.css';

const PollCreator = ({ groupId, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const { loading, createPoll } = useGroupPolls(groupId);

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreate = async () => {
        const validOptions = options.filter(opt => opt.trim().length > 0);
        if (question.trim() && validOptions.length >= 2) {
            const poll = await createPoll(question, validOptions, user?.id);
            if (poll) {
                onSuccess?.();
                onClose();
            }
        }
    };

    const isValid = question.trim().length > 0 && options.filter(opt => opt.trim().length > 0).length >= 2;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Create Poll</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.field}>
                        <label>Question</label>
                        <input
                            type="text"
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            maxLength={200}
                            autoFocus
                        />
                        <span className={styles.counter}>{question.length}/200</span>
                    </div>

                    <div className={styles.field}>
                        <label>Options</label>
                        {options.map((option, index) => (
                            <div key={index} className={styles.optionRow}>
                                <input
                                    type="text"
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    maxLength={100}
                                />
                                {options.length > 2 && (
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => removeOption(index)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        {options.length < 10 && (
                            <button className={styles.addButton} onClick={addOption}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Add Option
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreate}
                        disabled={!isValid || loading}
                        loading={loading}
                        fullWidth
                    >
                        Create Poll
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PollCreator;
