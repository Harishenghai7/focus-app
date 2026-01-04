import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { focusToast } from '../../utils/focusToast';
import styles from './ChangePasswordModal.module.css';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber,
            strength: [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length
        };
    };

    const getPasswordStrength = (password) => {
        const { strength } = validatePassword(password);
        if (strength === 0) return { label: '', color: '' };
        if (strength === 1) return { label: 'Weak', color: 'var(--error)' };
        if (strength === 2) return { label: 'Fair', color: 'var(--warning)' };
        if (strength === 3) return { label: 'Good', color: 'var(--info)' };
        return { label: 'Strong', color: 'var(--success)' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (!currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }
        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
        } else {
            const { isValid } = validatePassword(newPassword);
            if (!isValid) {
                newErrors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, and number';
            }
        }
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            focusToast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (error) {
            console.error('Error changing password:', error);
            focusToast.error(error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(newPassword);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    type="password"
                    label="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    error={errors.currentPassword}
                    placeholder="Enter current password"
                />

                <div className={styles.passwordField}>
                    <Input
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        error={errors.newPassword}
                        placeholder="Enter new password"
                    />
                    {newPassword && (
                        <div className={styles.strengthIndicator}>
                            <div className={styles.strengthBar}>
                                <div
                                    className={styles.strengthFill}
                                    style={{
                                        width: `${(passwordStrength.strength || 0) * 25}%`,
                                        background: passwordStrength.color
                                    }}
                                />
                            </div>
                            <span className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                                {passwordStrength.label}
                            </span>
                        </div>
                    )}
                </div>

                <Input
                    type="password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    placeholder="Confirm new password"
                />

                <div className={styles.actions}>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        Change Password
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;
