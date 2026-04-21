// SubmitTicket - Support ticket creation page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupport } from '../hooks/useSupport';
import { useFocusly } from '../context/FocuslyContext';
import { supabase } from '../lib/supabase';
import { SUPPORT_CATEGORIES } from '../utils/supportCategories';
import PageShell from '../components/layout/PageShell';
import styles from './SubmitTicket.module.css';

const SubmitTicket = () => {
    const navigate = useNavigate();
    const { createTicket, isCreating } = useSupport();
    const focusly = useFocusly();
    const [formData, setFormData] = useState({
        category: '',
        subject: '',
        description: '',
        attachments: []
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🦁 Pillar 5 — Focusly becomes the first-responder visually BEFORE the call resolves
        try {
            focusly.think("I'm reading your ticket now, Macha. Give me a second…");
        } catch (_) {}

        const result = await createTicket(formData);

        if (result.success) {
            const newTicketId = result?.data?.id || result?.data?.[0]?.id || result?.ticketId;

            // 🚑 Pillar 5 — Invoke `focusly-triage` Edge Function to post the
            // AI first-response message on the ticket thread. Fire-and-forget.
            if (newTicketId) {
                supabase.functions.invoke('focusly-triage', {
                    body: {
                        ticketId: newTicketId,
                        subject: formData.subject,
                        description: formData.description,
                        category: formData.category,
                    },
                }).catch(err => console.warn('[focusly-triage] background failed:', err?.message));
            }

            // 🦁 Celebrate the ticket being received
            try {
                focusly.motivate(
                    "Got it! You'll see my first reply in the thread in a moment, then a human takes over."
                );
            } catch (_) {}

            navigate('/support', { replace: true });
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <PageShell>
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
        </PageShell>
    );
};

export default SubmitTicket;
