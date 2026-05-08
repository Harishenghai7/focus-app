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
    const [status, setStatus] = useState('idle');
    const [typedTitle, setTypedTitle] = useState('');
    const debouncedUsername = useDebounce(formData.username, 500);
    const fullTitle = 'Welcome to Focus! ✨';

    const isFormValid = formData.username?.length >= 3 && formData.full_name?.length >= 2 && status === 'available';

    // Typing animation for title
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setTypedTitle(fullTitle.slice(0, i + 1));
            i++;
            if (i >= fullTitle.length) clearInterval(interval);
        }, 55);
        return () => clearInterval(interval);
    }, []);

    // Username availability check
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

    const StatusIcon = () => {
        if (status === 'checking') return <Loader2 size={16} className={styles.spinnerIcon} style={{ animation: 'spin 1s linear infinite', color: '#a78bfa' }} />;
        if (status === 'available') return <Check size={16} color="#10b981" />;
        if (status === 'taken' || status === 'error') return <X size={16} color="#ef4444" />;
        return null;
    };

    const bioLength = (formData.bio || '').length;
    const bioPercentage = Math.round((bioLength / 150) * 100);

    return (
        <div className={styles.container}>
            {/* Typing title */}
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {typedTitle}
                    <span className={styles.cursor}>|</span>
                </h2>
                <p className={styles.subtitle}>Let's craft your digital identity — the real you, beautifully presented.</p>
            </div>

            <div className={styles.mainLayout}>
                {/* Avatar upload */}
                <div className={styles.avatarSection}>
                    <ProfilePictureUpload
                        onFileSelect={(file) => updateFormData('avatarFile', file)}
                        preview={formData.avatarPreview}
                    />
                    <p className={styles.avatarHint}>Drag a photo or click to upload</p>
                </div>

                {/* Form fields */}
                <div className={styles.form}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Username</label>
                        <Input
                            name="username"
                            placeholder="Choose a unique @handle"
                            value={formData.username || ''}
                            onChange={(e) => updateFormData('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            icon="@"
                            rightElement={<StatusIcon />}
                            error={status === 'taken' ? 'This handle is already taken' : ''}
                        />
                        {status === 'available' && (
                            <span className={styles.fieldSuccess}>✓ Available — great choice!</span>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Display Name</label>
                        <Input
                            name="full_name"
                            placeholder="Your visible name"
                            value={formData.full_name || ''}
                            onChange={(e) => updateFormData('full_name', e.target.value)}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                            Bio
                            <span className={styles.charRing} style={{ '--bio-pct': `${bioPercentage}%` }}>
                                {bioLength}/150
                            </span>
                        </label>
                        <textarea
                            name="bio"
                            placeholder="A short intro about you — what drives you, what you love..."
                            value={formData.bio || ''}
                            onChange={(e) => updateFormData('bio', e.target.value.slice(0, 150))}
                            maxLength={150}
                            rows={3}
                            className={styles.bioTextarea}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Website <span className={styles.optional}>(optional)</span></label>
                        <Input
                            name="website"
                            placeholder="https://yoursite.com"
                            value={formData.website || ''}
                            onChange={(e) => updateFormData('website', e.target.value)}
                            type="url"
                        />
                    </div>
                </div>
            </div>

            {/* Live preview card */}
            {(formData.username || formData.full_name) && (
                <div className={styles.previewCard}>
                    <span className={styles.previewLabel}>Live Preview</span>
                    <div className={styles.previewContent}>
                        <div className={styles.previewAvatar}>
                            {formData.avatarPreview ? (
                                <img src={formData.avatarPreview} alt="" className={styles.previewAvatarImg} />
                            ) : (
                                <span className={styles.previewAvatarPlaceholder}>
                                    {(formData.full_name || formData.username || '?')[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className={styles.previewName}>{formData.full_name || 'Your Name'}</p>
                            <p className={styles.previewHandle}>@{formData.username || 'username'}</p>
                            {formData.bio && <p className={styles.previewBio}>{formData.bio}</p>}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.actions}>
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
