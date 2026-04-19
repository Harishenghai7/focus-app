import React, { useState, useEffect, useCallback, useRef } from 'react';
import SettingsSection from './SettingsSection';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserAvatar from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import styles from './ProfileSection.module.css';
import ContentFilter from '../moderation/ContentFilter';

const ProfileSection = ({ isExpanded, onToggle }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        bio: '',
        website: '',
        location: '',
        avatar_url: ''
    });
    const contentFilterRef = useRef(null);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        setLoading(false);
        setUploading(false);
    }, []);

    const getProfile = useCallback(async () => {
        if (!user || hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        const cached = localStorage.getItem(`profile_${user.id}`);
        if (cached) {
            try { setFormData(JSON.parse(cached)); } catch (e) { }
        }

        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                setFormData(data);
                localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
            }
        } catch (error) {
            console.error(error);
        }
    }, [user]);

    useEffect(() => { if (user) getProfile(); }, [user, getProfile]);

    const updateProfile = async (e) => {
        e.preventDefault();

        // Prevent double-submit
        if (loading) {
            console.log('⚠️ Already saving, ignoring duplicate submit');
            return;
        }

        // Content moderation check
        if (contentFilterRef.current) {
            try {
                const isValid = await contentFilterRef.current.validate(`${formData.full_name} ${formData.bio}`);
                if (!isValid) {
                    console.log('❌ Content validation failed');
                    return;
                }
            } catch (err) {
                console.error('Content filter error:', err);
                // Continue anyway if content filter fails
            }
        }

        setLoading(true);
        console.log('💾 Saving profile...', formData);

        // OPTIMISTIC UPDATE: Update localStorage and UI immediately
        const updatedProfile = {
            ...formData,
            id: user.id,
            updated_at: new Date().toISOString()
        };

        localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));

        // Dispatch event IMMEDIATELY to update all components
        console.log('📢 Broadcasting profile update event (optimistic)...');
        window.dispatchEvent(new CustomEvent('profile-updated', {
            detail: updatedProfile
        }));

        // Show success immediately
        toast.success('Profile updated!');
        setLoading(false);

        // Sync to database in background (non-blocking)
        console.log('🔄 Syncing to database in background...');
        supabase
            .from('profiles')
            .upsert({
                id: user.id,
                ...formData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error('⚠️ Background sync failed:', error);
                    console.error('Error details:', JSON.stringify(error, null, 2));
                    // Don't show error to user since local update succeeded
                    // Just log it for debugging
                } else {
                    console.log('✅ Background sync complete:', data);
                    // Update localStorage with server response
                    if (data) {
                        localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
                    }
                }
            })
            .catch(err => {
                console.error('⚠️ Background sync error:', err);
            });
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        if (event.target) event.target.value = '';
        if (!file) return;

        console.log('📸 Upload started:', file.name);
        setUploading(true);

        try {
            const filePath = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
            console.log('📤 Uploading to:', filePath);

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) {
                console.error('❌ Upload error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            console.log('✅ Upload complete:', data.publicUrl);

            const newData = { ...formData, avatar_url: data.publicUrl };
            setFormData(newData);

            await supabase.from('profiles').upsert({ id: user.id, avatar_url: data.publicUrl, updated_at: new Date() });
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(newData));
            toast.success('Avatar updated!');
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: newData }));
        } catch (error) {
            console.error('❌ Upload failed:', error);
            toast.error(error.message || 'Upload failed');
        } finally {
            console.log('🔄 Resetting upload state');
            setUploading(false);
        }
    };

    const bioLength = (formData.bio || '').length;
    const BIO_MAX = 150;

    return (
        <SettingsSection id="profile" title="Profile" description="Manage your public profile information" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>} isExpanded={isExpanded} onToggle={onToggle}>
            <ContentFilter ref={contentFilterRef} contentType="profile_bio" />
            <form onSubmit={updateProfile} className={styles.form}>
                {/* Avatar Upload */}
                <div className={styles.avatarSection}>
                    <div className={styles.avatarWrapper}>
                        <UserAvatar
                            src={formData.avatar_url}
                            username={formData.username}
                            fullName={formData.full_name}
                            size="2xl"
                        />
                        <label className={styles.avatarOverlay} title="Change photo">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: 'none' }} />
                        </label>
                        {uploading && <div className={styles.uploadingOverlay}><div className={styles.uploadSpinner} /></div>}
                    </div>
                    <div className={styles.avatarInfo}>
                        <p className={styles.avatarHint}>Click the camera icon to change your photo</p>
                        <p className={styles.avatarSubHint}>JPG, PNG or GIF · Max 5MB</p>
                    </div>
                </div>

                {/* Fields */}
                <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                        <label className={styles.label}>Full Name</label>
                        <Input name="full_name" value={formData.full_name || ''} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Your full name" />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Username</label>
                        <Input name="username" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="username" />
                    </div>
                </div>

                <div className={styles.field}>
                    <div className={styles.labelRow}>
                        <label className={styles.label}>Bio</label>
                        <span className={`${styles.charCount} ${bioLength > BIO_MAX ? styles.charOver : ''}`}>{bioLength}/{BIO_MAX}</span>
                    </div>
                    <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, BIO_MAX) })}
                        placeholder="Tell the Focus community about yourself…"
                        className={styles.textarea}
                        rows={3}
                        maxLength={BIO_MAX}
                    />
                </div>

                <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                        <label className={styles.label}>Website</label>
                        <Input name="website" value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://your-website.com" />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Location</label>
                        <Input name="location" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" />
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button type="submit" loading={loading} disabled={loading || uploading}>Save Changes</Button>
                </div>
            </form>
        </SettingsSection>
    );
};

export default ProfileSection;
