import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Check, Loader2 } from 'lucide-react';
import UserAvatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { triggerHaptic } from '../../utils/haptics';
import styles from './EditProfileModal.module.css';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        username: profile?.username || '',
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        website: profile?.website || '',
        location: profile?.location || ''
    });
    
    const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setAvatarFile(file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        triggerHaptic(10);
    };

    const uploadAvatar = async () => {
        if (!avatarFile) return profile?.avatar_url;

        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSave = async () => {
        if (!user) return;
        
        setIsSaving(true);
        setError(null);
        
        try {
            // Upload avatar if changed
            const avatarUrl = await uploadAvatar();
            
            // Update profile
            const updates = {
                ...formData,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Success state
            setIsSuccess(true);
            triggerHaptic(20);
            
            // Notify parent
            onUpdate?.(updates);
            
            // Close after brief delay
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
            }, 800);
            
        } catch (err) {
            console.error('Error saving profile:', err);
            setError(err.message || 'Failed to save profile');
            triggerHaptic(1);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isSaving) {
            onClose();
        }
    };

    // Reset form when opened
    React.useEffect(() => {
        if (isOpen && profile) {
            setFormData({
                username: profile.username || '',
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                website: profile.website || '',
                location: profile.location || ''
            });
            setAvatarPreview(profile.avatar_url);
            setAvatarFile(null);
            setError(null);
            setIsSuccess(false);
        }
    }, [isOpen, profile]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        className={styles.sheet}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ 
                            duration: 0.35, 
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.05
                        }}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <h2 className={styles.title}>Edit Profile</h2>
                            <button 
                                className={styles.closeBtn}
                                onClick={onClose}
                                disabled={isSaving}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Avatar Section */}
                        <div className={styles.avatarSection}>
                            <motion.button
                                className={styles.avatarWrapper}
                                onClick={handleAvatarClick}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <UserAvatar
                                    src={avatarPreview}
                                    username={formData.username}
                                    fullName={formData.full_name}
                                    size="3xl"
                                    className={styles.avatar}
                                />
                                <div className={styles.cameraOverlay}>
                                    <Camera size={28} color="white" />
                                    <span>Change Photo</span>
                                </div>
                            </motion.button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className={styles.hiddenInput}
                            />
                        </div>

                        {/* Form Fields */}
                        <div className={styles.form}>
                            <div className={styles.field}>
                                <label className={styles.label}>Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => handleChange('username', e.target.value)}
                                    className={styles.input}
                                    placeholder="username"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    className={styles.input}
                                    placeholder="Your name"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    className={`${styles.input} ${styles.textarea}`}
                                    placeholder="Tell us about yourself..."
                                    rows={3}
                                    maxLength={150}
                                />
                                <span className={styles.charCount}>
                                    {formData.bio?.length || 0}/150
                                </span>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Website</label>
                                <input
                                    type="text"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    className={styles.input}
                                    placeholder="https://your-website.com"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    className={styles.input}
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div 
                                className={styles.error}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Success Message */}
                        {isSuccess && (
                            <motion.div 
                                className={styles.success}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Check size={20} />
                                <span>Saved!</span>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className={styles.actions}>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                loading={isSaving}
                                disabled={isSaving || isSuccess}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={18} className={styles.spinner} />
                                        Saving...
                                    </>
                                ) : isSuccess ? (
                                    <>
                                        <Check size={18} />
                                        Saved
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditProfileModal;
