import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { focusToast } from '../../utils/focusToast';
import styles from './ScheduleMessageModal.module.css';

const ScheduleMessageModal = ({ currentUserId, recipientId, onClose, onSchedule }) => {
    const [message, setMessage] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [loading, setLoading] = useState(false);

    const getMinDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return {
            date: `${year}-${month}-${day}`,
            time: `${hours}:${minutes}`
        };
    };

    const handleSchedule = async () => {
        if (!message.trim()) {
            focusToast.error('Please enter a message');
            return;
        }

        if (!scheduleDate || !scheduleTime) {
            focusToast.error('Please select date and time');
            return;
        }

        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        const now = new Date();

        if (scheduledDateTime <= now) {
            focusToast.error('Scheduled time must be in the future');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('scheduled_messages')
                .insert({
                    sender_id: currentUserId,
                    receiver_id: recipientId,
                    content: message.trim(),
                    scheduled_for: scheduledDateTime.toISOString(),
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Message scheduled successfully');
            onSchedule?.(data);
            onClose();
        } catch (error) {
            console.error('Error scheduling message:', error);
            focusToast.error('Failed to schedule message');
        } finally {
            setLoading(false);
        }
    };

    const minDateTime = getMinDateTime();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Schedule Message</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <label className={styles.label}>Message</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>Schedule For</label>
                        <div className={styles.dateTimeInputs}>
                            <input
                                type="date"
                                className={styles.input}
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={minDateTime.date}
                            />
                            <input
                                type="time"
                                className={styles.input}
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {scheduleDate && scheduleTime && (
                        <div className={styles.preview}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>
                                Will be sent on {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.scheduleButton}
                        onClick={handleSchedule}
                        disabled={!message.trim() || !scheduleDate || !scheduleTime || loading}
                    >
                        {loading ? 'Scheduling...' : 'Schedule Message'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleMessageModal;
