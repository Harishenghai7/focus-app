import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useFocusUser } from '../context/FocusUserContext';
import { saveOnboardingData } from '../utils/saveOnboardingData';
import { uploadImage } from '../utils/uploadImage';

const TOTAL_STEPS = 6;

const useOnboarding = () => {
    const { user, refreshProfile, updateProfileState: updateAuthProfile } = useAuth();
    const { updateProfileState: updateFocusProfile } = useFocusUser();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Form Data State
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        website: '',
        avatarFile: null,
        avatarPreview: null,
        interests: [],
        followedUsers: [],
        notificationsEnabled: false,
        ageTier: null,
        ageVerified: false,
        ageInfo: null,
        trustShieldStatus: 'PENDING'
    });

    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const completeOnboarding = async () => {
        if (!user) {
            setError('User not authenticated. Please log in again.');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            let avatarUrl = null;

            if (formData.avatarFile) {
                // User uploaded custom avatar - use it (highest priority)
                avatarUrl = await uploadImage(formData.avatarFile, user.id);
            } else if (user.user_metadata?.avatar_url) {
                // No custom upload, use OAuth avatar if available
                avatarUrl = user.user_metadata.avatar_url;
            }

            if (avatarUrl && avatarUrl.startsWith('data:image')) {
                // Prevent massive payload sizes from base64 strings
                avatarUrl = null;
            }

            const updatedProfileData = {
                username: formData.username,
                full_name: formData.full_name,
                bio: formData.bio,
                website: formData.website,
                avatar_url: avatarUrl,
                onboarding_completed: true,
                verification_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
                trust_shield_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'
            };

            if (updateAuthProfile) updateAuthProfile(updatedProfileData);
            if (updateFocusProfile) updateFocusProfile(updatedProfileData);

            // 5-second timeout race to prevent hanging
            const trustShieldData = {
                verification_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
                trust_shield_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
                identity_hash: formData.identityHash || null,
            };

            const savePromise = saveOnboardingData(
                user.id,
                {
                    username: formData.username,
                    full_name: formData.full_name,
                    bio: formData.bio,
                    website: formData.website,
                    avatar_url: avatarUrl
                },
                formData.interests,
                trustShieldData
            );

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 8000)
            );

            await Promise.race([savePromise, timeoutPromise]);

            // Create follows for selected users
            if (formData.followedUsers && formData.followedUsers.length > 0) {
                const { supabase } = await import('../lib/supabase');
                const followInserts = formData.followedUsers.map(followingId => ({
                    follower_id: user.id,
                    following_id: followingId,
                    created_at: new Date().toISOString()
                }));

                await supabase.from('follows').insert(followInserts);

                // Create notifications for followed users
                const notificationInserts = formData.followedUsers.map(followingId => ({
                    user_id: followingId,
                    type: 'follow',
                    actor_id: user.id,
                    is_read: false,
                    created_at: new Date().toISOString()
                }));

                await supabase.from('notifications').insert(notificationInserts);
            }

            // Handle notifications permission if enabled
            if (formData.notificationsEnabled && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const { supabase } = await import('../lib/supabase');
                    await supabase
                        .from('user_settings')
                        .update({
                            notifications_enabled: true,
                            push_notifications: true
                        })
                        .eq('user_id', user.id);
                }
            }

            // Refresh profile in AuthContext to update Sidebar/UI immediately (confirm from DB)
            if (refreshProfile) {
                await refreshProfile();
            }

            console.log('Onboarding complete, navigating to home...');
            setIsSubmitting(false); // Stop loading before navigating
            navigate('/home', { replace: true }); // Use replace to prevent going back
        } catch (err) {
            console.error('Onboarding error:', err);

            // If timeout or interest error, force proceed
            if (
                err.message === 'Request timed out' ||
                err.message?.includes('user_interests') ||
                err.code === '42P01'
            ) {
                console.warn('Proceeding despite error:', err.message);
                setIsSubmitting(false);
                navigate('/home', { replace: true });
            } else {
                setError(err.message || 'Failed to save profile. Please try again.');
                setIsSubmitting(false);
            }
        }
    };

    return {
        currentStep,
        totalSteps: TOTAL_STEPS,
        formData,
        updateFormData,
        nextStep,
        prevStep,
        isSubmitting,
        error,
        user
    };
};

export default useOnboarding;
