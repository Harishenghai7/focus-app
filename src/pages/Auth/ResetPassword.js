import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserPassword } from '../../utils/supabaseAuth';
import { validatePassword } from '../../utils/validatePassword';
import AuthLayout from '../../components/auth/AuthLayout';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import Toast from '../../components/shared/Toast';
import PasswordStrength from '../../components/auth/PasswordStrength';
import usePasswordStrength from '../../hooks/usePasswordStrength';
import styles from './Auth.module.css';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});

    const { strength, score } = usePasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validate password
        const pwCheck = validatePassword(password);
        if (!pwCheck.isValid) {
            setErrors({ password: pwCheck.errors[0] });
            return;
        }

        // Check passwords match
        if (password !== confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        setLoading(true);

        try {
            const { error } = await updateUserPassword(password);

            if (error) {
                console.error('Password reset error:', error);
                setToast({
                    type: 'error',
                    message: error.message || 'Failed to reset password. Please try again.'
                });
            } else {
                setToast({
                    type: 'success',
                    message: 'Password updated successfully! Redirecting to login...'
                });

                setTimeout(() => {
                    navigate('/auth');
                }, 2000);
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

    return (
        <AuthLayout>
            <div className={styles.resetContainer}>
                <div className={styles.resetIcon}>
                    <FaLock size={48} />
                </div>

                <h2 className={styles.resetTitle}>Reset Your Password</h2>
                <p className={styles.resetSubtitle}>
                    Enter your new password below
                </p>

                <form onSubmit={handleSubmit} className={styles.resetForm}>
                    <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={errors.password}
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
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={errors.confirmPassword}
                        icon={<FaLock />}
                        rightElement={
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        }
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={loading}
                        disabled={!password || !confirmPassword}
                    >
                        {loading ? 'Updating Password...' : 'Reset Password'}
                    </Button>
                </form>

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

export default ResetPassword;
