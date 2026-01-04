import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import Toast from '../components/shared/Toast';
import PasswordStrength from '../components/auth/PasswordStrength';
import usePasswordStrength from '../hooks/usePasswordStrength';
import { validatePassword } from '../utils/validatePassword';
import { updateUserPassword } from '../utils/supabaseAuth';
import styles from '../components/auth/Auth.module.css';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const { strength, score } = usePasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const pwCheck = validatePassword(password);
        if (!pwCheck.isValid) {
            setToast({ type: 'error', message: pwCheck.errors[0] });
            return;
        }

        if (password !== confirmPassword) {
            setToast({ type: 'error', message: 'Passwords do not match' });
            return;
        }

        setIsSubmitting(true);
        const { error } = await updateUserPassword(password);
        setIsSubmitting(false);

        if (error) {
            setToast({ type: 'error', message: error.message });
        } else {
            setToast({ type: 'success', message: 'Password updated successfully!' });
            setTimeout(() => navigate('/auth'), 2000);
        }
    };

    return (
        <AuthLayout>
            <div className={styles.header}>
                <h2 className={styles.title}>Set New Password</h2>
                <p className={styles.subtitle}>
                    Create a strong password for your account
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<FaLock />}
                    rightElement={
                        <button
                            type="button"
                            className={styles.eyeButton}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    }
                />

                <PasswordStrength strength={strength} score={score} />

                <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<FaLock />}
                />

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                >
                    Update Password
                </Button>
            </form>

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

export default ResetPassword;
