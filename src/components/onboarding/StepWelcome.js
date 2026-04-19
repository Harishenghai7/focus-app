import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useDebounce from '../../hooks/useDebounce';
import styles from './StepWelcome.module.css';
import ProfilePictureUpload from './ProfilePictureUpload';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const StepWelcome = ({ formData, updateFormData, onNext }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle'); // 'idle', 'checking', 'available', 'taken', 'error'
    const debouncedUsername = useDebounce(formData.username, 500);

    const isFormValid = formData.username?.length >= 3 && formData.full_name?.length >= 2 && status === 'available';

    useEffect(() => {
        const checkUsername = async () => {
            const username = debouncedUsername?.trim().toLowerCase();
            if (!username || username.length < 3) {
                setStatus('idle');
                return;
            }

            setStatus('checking');

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', username)
                    .maybeSingle();

                if (error) throw error;

                if (data && data.id !== user?.id) {
                    setStatus('taken');
                } else {
                    setStatus('available');
                }
            } catch (err) {
                console.error('Error checking username:', err);
                setStatus('error');
            }
        };

        checkUsername();
    }, [debouncedUsername, user?.id]);

    const handleSkip = () => {
        // Skip to step 4 (notifications)
        for (let i = 0; i < 3; i++) {
            onNext();
        }
    };

    const StatusIcon = () => {
        if (status === 'checking') return <Loader2 size={16} className={styles.spinnerIcon} style={{ animation: 'spin 1s linear infinite', color: '#a78bfa' }} />;
        if (status === 'available') return <Check size={16} color="#10b981" />;
        if (status === 'taken' || status === 'error') return <X size={16} color="#ef4444" />;
        return null;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Welcome to Focus! 🎉</h2>
                <p className={styles.subtitle}>Let's set up your profile</p>
            </div>

            <ProfilePictureUpload
                onFileSelect={(file) => updateFormData('avatarFile', file)}
            />

            <div className={styles.form}>
                <Input
                    name="username"
                    placeholder="Choose a @handle"
                    value={formData.username || ''}
                    onChange={(e) => updateFormData('username', e.target.value)}
                    icon="@"
                    rightElement={<StatusIcon />}
                    error={status === 'taken' ? 'This handle is already taken' : ''}
                />

                <Input
                    name="full_name"
                    placeholder="Full Name"
                    value={formData.full_name || ''}
                    onChange={(e) => updateFormData('full_name', e.target.value)}
                />

                <div className={styles.bioWrapper}>
                    <textarea
                        name="bio"
                        placeholder="Write something about yourself..."
                        value={formData.bio || ''}
                        onChange={(e) => updateFormData('bio', e.target.value.slice(0, 150))}
                        maxLength={150}
                        rows={3}
                        className={styles.bioTextarea}
                    />
                    <span className={styles.charCount}>{(formData.bio || '').length}/150</span>
                </div>

                <Input
                    name="website"
                    placeholder="Website (Optional)"
                    value={formData.website || ''}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    type="url"
                />
            </div>

            <div className={styles.actions}>
                <Button
                    variant="ghost"
                    onClick={handleSkip}
                >
                    Skip
                </Button>
                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={!isFormValid}
                >
                    Continue
                </Button>
            </div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default StepWelcome;
