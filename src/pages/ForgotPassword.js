import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import Toast from '../components/shared/Toast';
import { validateEmail } from '../utils/validateEmail';
import { resetPasswordForEmail } from '../utils/supabaseAuth';
import styles from '../components/auth/Auth.module.css'; // Reuse auth styles
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setToast({ type: 'error', message: 'Email is required' });
            return;
        }
        if (!validateEmail(email)) {
            setToast({ type: 'error', message: 'Invalid email format' });
            return;
        }

        setIsSubmitting(true);
        const { error } = await resetPasswordForEmail(email);
        setIsSubmitting(false);

        if (error) {
            setToast({ type: 'error', message: error.message });
        } else {
            setToast({ type: 'success', message: 'Check your email for reset instructions' });
            setEmail('');
        }
    };

    return (
        <AuthLayout>
            <div className={styles.header}>
                <h2 className={styles.title}>Reset Password</h2>
                <p className={styles.subtitle}>
                    Enter your email to receive password reset instructions
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<FaEnvelope />}
                />

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                >
                    Send Reset Link
                </Button>
            </form>

            <div className={styles.toggleText}>
                <Link to="/auth" className={styles.backLink}>
                    <FaArrowLeft style={{ marginRight: '0.5rem' }} /> Back to Login
                </Link>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </AuthLayout>
    );
};

export default ForgotPassword;
