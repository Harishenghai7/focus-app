import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { focusToast } from '../../utils/focusToast';
import styles from './DeleteAccountModal.module.css';

const DeleteAccountModal = ({ isOpen, onClose }) => {
    const { user, signOut } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [understood, setUnderstood] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const handleClose = () => {
        setPassword('');
        setConfirmText('');
        setUnderstood(false);
        setStep(1);
        onClose();
    };

    const handleNextStep = () => {
        if (step === 1 && understood) {
            setStep(2);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();

        if (confirmText !== 'DELETE') {
            focusToast.error('Please type DELETE to confirm');
            return;
        }

        if (!password) {
            focusToast.error('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            // Verify password first
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });

            if (signInError) {
                throw new Error('Incorrect password');
            }

            // Delete user data from custom tables
            await supabase.from('user_settings').delete().eq('user_id', user.id);
            await supabase.from('posts').delete().eq('user_id', user.id);
            await supabase.from('blocked_users').delete().eq('user_id', user.id);
            await supabase.from('linked_accounts').delete().eq('user_id', user.id);

            // Delete auth user (this will cascade delete related data)
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

            if (deleteError) throw deleteError;

            focusToast.success('Account deleted successfully');
            await signOut();
        } catch (error) {
            console.error('Error deleting account:', error);
            focusToast.error(error.message || 'Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Delete Account" className={styles.modal}>
            {step === 1 ? (
                <div className={styles.warningStep}>
                    <div className={styles.warningIcon}>⚠️</div>
                    <h3 className={styles.warningTitle}>This action cannot be undone</h3>
                    <p className={styles.warningText}>
                        Deleting your account will permanently remove:
                    </p>
                    <ul className={styles.warningList}>
                        <li>Your profile and all personal information</li>
                        <li>All your posts, boltz, and stories</li>
                        <li>Your followers and following connections</li>
                        <li>All your comments and interactions</li>
                        <li>Your saved content and preferences</li>
                    </ul>
                    <div className={styles.checkboxContainer}>
                        <input
                            type="checkbox"
                            id="understand"
                            checked={understood}
                            onChange={(e) => setUnderstood(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <label htmlFor="understand" className={styles.checkboxLabel}>
                            I understand that this action is permanent and irreversible
                        </label>
                    </div>
                    <div className={styles.actions}>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleNextStep}
                            disabled={!understood}
                            className={styles.dangerButton}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleDelete} className={styles.confirmStep}>
                    <p className={styles.confirmText}>
                        To confirm deletion, please type <strong>DELETE</strong> below and enter your password:
                    </p>
                    <Input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className={styles.input}
                    />
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={styles.input}
                    />
                    <div className={styles.actions}>
                        <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                            Back
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            disabled={confirmText !== 'DELETE' || !password}
                            className={styles.dangerButton}
                        >
                            Delete My Account
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default DeleteAccountModal;
