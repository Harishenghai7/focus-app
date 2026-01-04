import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { focusToast } from '../../utils/focusToast';
import styles from './FeedbackModal.module.css';

const FEEDBACK_TYPES = [
    { value: 'bug', label: '🐛 Bug Report', emoji: '🐛' },
    { value: 'feature', label: '💡 Feature Request', emoji: '💡' },
    { value: 'general', label: '💬 General Feedback', emoji: '💬' }
];

const MOOD_EMOJIS = ['😍', '😊', '😐', '😕', '😠'];

const FeedbackModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [type, setType] = useState('general');
    const [mood, setMood] = useState(null);
    const [message, setMessage] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setScreenshot(file);
        } else {
            focusToast.error('Please select an image file');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            focusToast.error('Please enter your feedback');
            return;
        }

        setLoading(true);

        try {
            let screenshotUrl = null;

            // Upload screenshot if provided
            if (screenshot) {
                const fileExt = screenshot.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('feedback-screenshots')
                    .upload(fileName, screenshot);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('feedback-screenshots')
                    .getPublicUrl(fileName);

                screenshotUrl = publicUrl;
            }

            // Save feedback
            const { error } = await supabase
                .from('feedback')
                .insert([{
                    user_id: user.id,
                    type,
                    mood,
                    message,
                    screenshot_url: screenshotUrl
                }]);

            if (error) throw error;

            focusToast.success('Thank you for your feedback!');
            setType('general');
            setMood(null);
            setMessage('');
            setScreenshot(null);
            onClose();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            focusToast.error('Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Feedback">
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.typeSelector}>
                    <label className={styles.label}>Feedback Type</label>
                    <div className={styles.typeButtons}>
                        {FEEDBACK_TYPES.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                className={`${styles.typeButton} ${type === t.value ? styles.active : ''}`}
                                onClick={() => setType(t.value)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.moodSelector}>
                    <label className={styles.label}>How are you feeling?</label>
                    <div className={styles.moodButtons}>
                        {MOOD_EMOJIS.map((emoji, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`${styles.moodButton} ${mood === index ? styles.active : ''}`}
                                onClick={() => setMood(index)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.messageField}>
                    <label className={styles.label}>Your Feedback</label>
                    <textarea
                        className={styles.textarea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind..."
                        rows={6}
                    />
                </div>

                <div className={styles.fileUpload}>
                    <label className={styles.label}>Attach Screenshot (Optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        id="screenshot-upload"
                    />
                    <label htmlFor="screenshot-upload" className={styles.fileLabel}>
                        {screenshot ? screenshot.name : '📎 Choose file...'}
                    </label>
                </div>

                <div className={styles.actions}>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        Submit Feedback
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default FeedbackModal;
