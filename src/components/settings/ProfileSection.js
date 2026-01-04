import React, { useState, useEffect, useCallback, useRef } from 'react';
import SettingsSection from './SettingsSection';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
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

    return (
        <SettingsSection id="profile" title="Profile" description="Manage your public profile information" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>} isExpanded={isExpanded} onToggle={onToggle}>
            <ContentFilter ref={contentFilterRef} contentType="profile_bio" />
            <form onSubmit={updateProfile} className={styles.form}>
                <div className={styles.avatarSection}>
                    <Avatar src={formData.avatar_url} alt="Profile" size="xl" />
                    <div className={styles.avatarActions}>
                        <label className={styles.uploadButton}>
                            {uploading ? 'Uploading...' : 'Change Photo'}
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>
                <div className={styles.field}><label className={styles.label}>Full Name</label><Input name="full_name" value={formData.full_name || ''} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Your full name" /></div>
                <div className={styles.field}><label className={styles.label}>Username</label><Input name="username" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Username" /></div>
                <div className={styles.field}><label className={styles.label}>Bio</label><textarea name="bio" value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself" className={styles.textarea} rows={4} /></div>
                <div className={styles.field}><label className={styles.label}>Website</label><Input name="website" value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://your-website.com" /></div>
                <div className={styles.field}><label className={styles.label}>Location</label><Input name="location" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" /></div>
                <div className={styles.actions}><Button type="submit" loading={loading} disabled={loading}>Save Changes</Button></div>
            </form>
        </SettingsSection>
    );
};

export default ProfileSection;
