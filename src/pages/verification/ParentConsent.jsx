import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import styles from './ParentConsent.module.css';

/**
 * Parent Consent Request Component
 * For teen users (13-17) to request parent/guardian verification
 */
const ParentConsent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [parentEmail, setParentEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const sendParentConsentRequest = async (e) => {
        e.preventDefault();

        if (!parentEmail || !parentEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);

            // Call Edge Function to send consent email
            const { data, error } = await supabase.functions.invoke('send-parent-consent-email', {
                body: {
                    parentEmail,
                    childName: user.user_metadata?.full_name || user.email,
                    childUserId: user.id
                }
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'Failed to send consent request');
            }

            setRequestSent(true);
            toast.success('Consent request sent successfully!');

        } catch (error) {
            console.error('Parent consent error:', error);
            toast.error(error.message || 'Failed to send consent request');
        } finally {
            setLoading(false);
        }
    };

    if (requestSent) {
        return (
            <div className={styles.container}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✅</div>
                    <h2>Consent Request Sent!</h2>
                    <p>
                        We've sent a verification email to <strong>{parentEmail}</strong>
                    </p>

                    <div className={styles.infoBox}>
                        <h3>What happens next?</h3>
                        <ol>
                            <li>Your parent/guardian will receive an email with a verification link</li>
                            <li>They will verify their identity using DigiLocker</li>
                            <li>They will review and approve your account</li>
                            <li>You'll receive a notification when approved</li>
                        </ol>
                    </div>

                    <div className={styles.warningBox}>
                        <p>⏰ The verification link expires in 7 days</p>
                        <p>📧 Ask your parent/guardian to check their email (including spam folder)</p>
                    </div>

                    <button
                        className={styles.primaryBtn}
                        onClick={() => navigate('/verification-center')}
                    >
                        Back to Verification Center
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/verification-center')}>
                    ← Back
                </button>
                <h1 className={styles.title}>Parent/Guardian Consent</h1>
            </div>

            <div className={styles.card}>
                <div className={styles.icon}>👨‍👩‍👦</div>
                <h2>Parent/Guardian Consent Required</h2>
                <p className={styles.subtitle}>
                    Since you are under 18, we need your parent or guardian to verify your account
                </p>

                <div className={styles.infoBox}>
                    <h3>Why is this required?</h3>
                    <ul>
                        <li>✅ Ensures your safety on the platform</li>
                        <li>✅ Gives parents visibility into your account</li>
                        <li>✅ Complies with digital safety regulations</li>
                        <li>✅ Protects you from harmful content</li>
                    </ul>
                </div>

                <form onSubmit={sendParentConsentRequest} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="parentEmail">Parent/Guardian Email Address</label>
                        <input
                            id="parentEmail"
                            type="email"
                            placeholder="parent@example.com"
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            required
                            className={styles.input}
                        />
                        <p className={styles.hint}>
                            Make sure this is an email address your parent/guardian can access
                        </p>
                    </div>

                    <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Consent Request'}
                    </button>
                </form>

                <div className={styles.helpBox}>
                    <p>
                        <strong>Need help?</strong> Ask your parent/guardian to:
                    </p>
                    <ul>
                        <li>Check their email inbox (and spam folder)</li>
                        <li>Have their Aadhaar card ready for verification</li>
                        <li>Complete the verification within 7 days</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ParentConsent;
