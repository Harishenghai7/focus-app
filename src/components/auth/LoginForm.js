import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Toast from '../shared/Toast';
import useFormValidation from '../../hooks/useFormValidation';
import { signInWithEmail, signInWithUsername, isEmailVerified, updateUserPresence } from '../../utils/supabaseAuth';
import styles from './LoginForm.module.css';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginForm = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const validate = (values) => {
        const errors = {};
        if (!values.identifier) {
            errors.identifier = 'Email or username is required';
        }
        if (!values.password) {
            errors.password = 'Password is required';
        }
        return errors;
    };

    const {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit
    } = useFormValidation({
        identifier: '', // Can be email or username
        password: '',
        rememberMe: false
    }, validate);

    const onSubmit = async (formValues) => {
        try {
            let result;

            // Check if identifier is email or username
            const isEmail = formValues.identifier.includes('@');

            if (isEmail) {
                // Login with email
                result = await signInWithEmail(formValues.identifier, formValues.password);
            } else {
                // Login with username
                result = await signInWithUsername(formValues.identifier, formValues.password);
            }

            const { data, error } = result;

            if (error) {
                console.error('Login error:', error);

                if (error.message.includes('Email not confirmed')) {
                    setShowVerificationModal(true);
                    setToast({
                        type: 'warning',
                        message: 'Please verify your email address before logging in. Check your inbox and spam folder.'
                    });
                } else if (error.message.includes('Invalid') || error.message.includes('not found')) {
                    setToast({
                        type: 'error',
                        message: 'Incorrect email/username or password. Please try again.'
                    });
                } else {
                    setToast({
                        type: 'error',
                        message: error.message || 'Login failed. Please try again.'
                    });
                }
                return;
            }

            // Check if email is verified
            if (data?.user && !isEmailVerified(data.user)) {
                setShowVerificationModal(true);
                setToast({
                    type: 'warning',
                    message: 'Please verify your email before logging in.'
                });
                return;
            }

            // Update user presence to online
            if (data?.user) {
                await updateUserPresence(data.user.id, true);
            }

            // Handle remember me
            if (formValues.rememberMe && data?.session) {
                // Session is already stored by Supabase, but we can add a flag
                localStorage.setItem('focus_remember_me', 'true');
            } else {
                localStorage.removeItem('focus_remember_me');
            }

            setToast({ type: 'success', message: 'Welcome back!' });

            // Redirect will be handled by auth state change listener in App or AuthProvider
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            console.error('Unexpected login error:', err);
            setToast({
                type: 'error',
                message: 'An unexpected error occurred. Please try again.'
            });
        }
    };

    return (
        <>
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
                <Input
                    name="identifier"
                    type="text"
                    placeholder="Email or Username"
                    value={values.identifier}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.identifier}
                    icon={<FaEnvelope />}
                    autoComplete="username"
                />

                <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.password}
                    icon={<FaLock />}
                    autoComplete="current-password"
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

                <div className={styles.row}>
                    <Checkbox
                        name="rememberMe"
                        label="Remember me"
                        checked={values.rememberMe}
                        onChange={handleChange}
                    />
                    <Link to="/forgot-password" className={styles.forgotLink}>
                        Forgot Password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                >
                    Login
                </Button>

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </form>

            {/* Email Verification Modal */}
            {showVerificationModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Email Verification Required</h3>
                        <p>Please verify your email address before logging in.</p>
                        <p>Check your inbox and spam folder for the verification link.</p>
                        <div className={styles.modalActions}>
                            <Button
                                variant="secondary"
                                onClick={() => setShowVerificationModal(false)}
                            >
                                Close
                            </Button>
                            <Link to="/verify-email">
                                <Button variant="primary">
                                    Resend Verification
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LoginForm;

