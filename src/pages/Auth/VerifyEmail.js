import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { resendVerificationEmail } from '../../utils/supabaseAuth';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/shared/Button';
import Toast from '../../components/shared/Toast';
import styles from './Auth.module.css';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [toast, setToast] = useState(null);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        // Get user email from session or local storage
        const getUserEmail = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email);
            } else {
                // If no user, redirect to auth page
                navigate('/auth');
            }
        };

        getUserEmail();
    }, [navigate]);

    useEffect(() => {
        // Countdown timer for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResendVerification = async () => {
        if (countdown > 0) return;

        setResending(true);

        try {
            const { error } = await resendVerificationEmail(email);

            if (error) {
                console.error('Resend error:', error);
                setToast({
                    type: 'error',
                    message: 'Failed to resend verification email. Please try again.'
                });
            } else {
                setToast({
                    type: 'success',
                    message: 'Verification email sent! Check your inbox and spam folder.'
                });
                setCountdown(60); // 60 second cooldown
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setToast({
                type: 'error',
                message: 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthLayout>
            <div className={styles.verifyContainer}>
                <div className={styles.verifyIcon}>
                    <FaEnvelope size={64} />
                </div>

                <h2 className={styles.verifyTitle}>Verify Your Email</h2>

                <p className={styles.verifyText}>
                    We've sent a verification link to:
                </p>

                <div className={styles.emailDisplay}>
                    <FaEnvelope className={styles.emailIcon} />
                    <span>{email}</span>
                </div>

                <p className={styles.verifyText}>
                    Click the link in the email to activate your account.
                    Don't forget to check your spam folder!
                </p>

                <div className={styles.verifyActions}>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={handleResendVerification}
                        isLoading={resending}
                        disabled={countdown > 0}
                    >
                        {countdown > 0
                            ? `Resend in ${countdown}s`
                            : resending
                                ? 'Sending...'
                                : 'Resend Verification Email'}
                    </Button>

                    <Link to="/auth" className={styles.backLink}>
                        <Button variant="secondary" fullWidth>
                            Back to Login
                        </Button>
                    </Link>
                </div>

                <div className={styles.verifyTips}>
                    <h4>Didn't receive the email?</h4>
                    <ul>
                        <li>Check your spam or junk folder</li>
                        <li>Make sure you entered the correct email address</li>
                        <li>Wait a few minutes and check again</li>
                        <li>Click "Resend" to get a new verification email</li>
                    </ul>
                </div>

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </AuthLayout>
    );
};

export default VerifyEmail;
