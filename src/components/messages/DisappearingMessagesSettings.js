import React, { useState } from 'react';
import { useDisappearingMessages } from '../../hooks/useDisappearingMessages';
import Button from '../ui/Button';
import styles from './DisappearingMessagesSettings.module.css';

const DisappearingMessagesSettings = ({ conversationId, onClose }) => {
    const [selectedDuration, setSelectedDuration] = useState(0);
    const { setDisappearingTimer } = useDisappearingMessages();

    const durations = [
        { value: 0, label: 'Off', description: 'Messages will not disappear' },
        { value: 86400, label: '24 Hours', description: 'Messages disappear after 1 day' },
        { value: 604800, label: '7 Days', description: 'Messages disappear after 1 week' },
        { value: 7776000, label: '90 Days', description: 'Messages disappear after 3 months' }
    ];

    const handleSave = async () => {
        await setDisappearingTimer(conversationId, selectedDuration);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="20" fill="rgba(139, 92, 246, 0.2)" />
                        <path d="M24 12v12l6 6" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h2>Disappearing Messages</h2>
                    <p>Messages will automatically delete after the selected time</p>
                </div>

                <div className={styles.options}>
                    {durations.map(duration => (
                        <button
                            key={duration.value}
                            className={`${styles.option} ${selectedDuration === duration.value ? styles.selected : ''}`}
                            onClick={() => setSelectedDuration(duration.value)}
                        >
                            <div className={styles.radio}>
                                {selectedDuration === duration.value && (
                                    <div className={styles.radioInner}></div>
                                )}
                            </div>
                            <div className={styles.optionContent}>
                                <div className={styles.optionLabel}>{duration.label}</div>
                                <div className={styles.optionDescription}>{duration.description}</div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} fullWidth>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DisappearingMessagesSettings;
