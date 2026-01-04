// SubmitTicket - Support ticket creation page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupport } from '../hooks/useSupport';
import { SUPPORT_CATEGORIES } from '../utils/supportCategories';
import styles from './SubmitTicket.module.css';

const SubmitTicket = () => {
    const navigate = useNavigate();
    const { createTicket, isCreating } = useSupport();
    const [formData, setFormData] = useState({
        category: '',
        subject: '',
        description: '',
        attachments: []
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await createTicket(formData);

        if (result.success) {
            navigate('/my-tickets');
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={styles.submitTicketPage}>
            <div className={styles.pageHeader}>
                <button className={styles.backButton} onClick={() => navigate('/support')}>
                    ← Back
                </button>
                <h1 className={styles.pageTitle}>Contact Support</h1>
                <p className={styles.pageSubtitle}>We're here to help! Describe your issue below.</p>
            </div>

            <form className={styles.ticketForm} onSubmit={handleSubmit}>
                {/* Category */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Category *</label>
                    <div className={styles.categoryGrid}>
                        {SUPPORT_CATEGORIES.map((cat) => (
                            <div
                                key={cat.id}
                                className={`${styles.categoryCard} ${formData.category === cat.id ? styles.selected : ''}`}
                                onClick={() => handleChange('category', cat.id)}
                            >
                                <div className={styles.categoryIcon}>{cat.icon}</div>
                                <div className={styles.categoryLabel}>{cat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subject */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Subject *</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Brief summary of your issue"
                        value={formData.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        maxLength={200}
                        required
                    />
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Description *</label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Please provide detailed information about your issue..."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        maxLength={5000}
                        rows={8}
                        required
                    />
                    <div className={styles.charCount}>{formData.description.length}/5000</div>
                </div>

                {/* Attachments */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Attachments (Optional)</label>
                    <button type="button" className={styles.uploadButton}>
                        📎 Add Files
                    </button>
                </div>

                {/* Submit */}
                <div className={styles.submitSection}>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isCreating || !formData.category || !formData.subject || !formData.description}
                    >
                        {isCreating ? 'Creating Ticket...' : 'Submit Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmitTicket;
