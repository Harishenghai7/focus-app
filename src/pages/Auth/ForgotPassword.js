import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPasswordForEmail } from '../../utils/supabaseAuth';
import { validateEmail } from '../../utils/validateEmail';
import AuthLayout from '../../components/auth/AuthLayout';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import Toast from '../../components/shared/Toast';
import styles from './Auth.module.css';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setToast(null);

        // Validate email
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const { error: resetError } = await resetPasswordForEmail(email);

            if (resetError) {
                console.error('Password reset error:', resetError);
                setToast({
                    type: 'error',
                    message: 'Failed to send reset email. Please try again.'
                });
            } else {
                setSent(true);
                setToast({
                    type: 'success',
                    message: 'Password reset link sent! Check your email.'
                });
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setToast({
                type: 'error',
                message: 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <AuthLayout>
                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>
                        <FaCheckCircle size={64} />
                    </div>

                    <h2 className={styles.successTitle}>Check Your Email</h2>

                    <p className={styles.successText}>
                        We've sent a password reset link to:
                    </p>

                    <div className={styles.emailDisplay}>
                        <FaEnvelope className={styles.emailIcon} />
                        <span>{email}</span>
                    </div>

                    <p className={styles.successText}>
                        Click the link in the email to reset your password.
                        The link will expire in 1 hour.
                    </p>

                    <Link to="/auth" className={styles.backLink}>
                        <Button variant="primary" fullWidth>
                            Back to Login
                        </Button>
                    </Link>

                    <div className={styles.helpText}>
                        <p>Didn't receive the email?</p>
                        <button
                            onClick={() => setSent(false)}
                            className={styles.resendButton}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className={styles.forgotContainer}>
                <h2 className={styles.forgotTitle}>Forgot Password?</h2>
                <p className={styles.forgotSubtitle}>
                    Enter your email address and we'll send you a link to reset your password
                </p>

                <form onSubmit={handleSubmit} className={styles.forgotForm}>
                    <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={error}
                        icon={<FaEnvelope />}
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={loading}
                        disabled={!email}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>

                <Link to="/auth" className={styles.backLink}>
                    Back to Login
                </Link>

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

export default ForgotPassword;
