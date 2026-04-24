// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ USE ONBOARDING PERSISTENT HOOK - Bulletproof Onboarding State
// ═══════════════════════════════════════════════════════════════════════════════
// Critical Fix: Prevents onboarding reset on page reload
// Persists step, form data, and progress to localStorage
// Auto-restores state on mount
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useFocusUser } from '../context/FocusUserContext';
import { saveOnboardingData } from '../utils/saveOnboardingData';
import { uploadImage } from '../utils/uploadImage';

const TOTAL_STEPS = 6;
const STORAGE_KEY = 'focus_onboarding_state';
const TIMESTAMP_KEY = 'focus_onboarding_timestamp';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Default form data
const DEFAULT_FORM_DATA = {
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
    trustShieldStatus: 'PENDING',
    trustShieldInitialized: false,
    trustShieldOCR: null,
    identityHash: null,
    guardianHandshakeLink: null,
    trustShieldFaceScore: null,
};

/**
 * Hook for managing onboarding state with localStorage persistence
 * Prevents users from losing progress on page reload
 */
const useOnboardingPersistent = () => {
    const { user, refreshProfile, updateProfileState: updateAuthProfile } = useAuth();
    const { updateProfileState: updateFocusProfile } = useFocusUser();
    const navigate = useNavigate();
    
    // Track if we've loaded from storage
    const hasLoadedRef = useRef(false);
    
    // Core states
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isRestored, setIsRestored] = useState(false);

    // Form Data State - deep merge with defaults
    const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA });

    // ═══════════════════════════════════════════════════════════════════════════
    // LAYER 1: Restore from localStorage on mount
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (hasLoadedRef.current) return;
        
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            const savedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
            
            if (savedState && savedTimestamp) {
                const timestamp = parseInt(savedTimestamp, 10);
                const now = Date.now();
                
                // Check if session is still valid (24 hours)
                if (now - timestamp < SESSION_TIMEOUT) {
                    const parsed = JSON.parse(savedState);
                    
                    // Restore step
                    if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= TOTAL_STEPS) {
                        setCurrentStep(parsed.currentStep);
                    }
                    
                    // Restore form data (deep merge with defaults)
                    if (parsed.formData) {
                        setFormData(prev => ({
                            ...DEFAULT_FORM_DATA,
                            ...parsed.formData,
                            // Don't restore File objects (not serializable)
                            avatarFile: null,
                        }));
                    }
                    
                    setIsRestored(true);
                    console.log('[Onboarding] Restored state from localStorage at step', parsed.currentStep);
                } else {
                    // Session expired - clear storage
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(TIMESTAMP_KEY);
                    console.log('[Onboarding] Session expired, starting fresh');
                }
            }
        } catch (err) {
            console.error('[Onboarding] Failed to restore state:', err);
            // Clear corrupted storage
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TIMESTAMP_KEY);
        }
        
        hasLoadedRef.current = true;
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // LAYER 2: Persist to localStorage on every change
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!hasLoadedRef.current) return;
        
        try {
            const stateToSave = {
                currentStep,
                formData: {
                    ...formData,
                    // Don't save File objects
                    avatarFile: null,
                },
            };
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        } catch (err) {
            console.error('[Onboarding] Failed to save state:', err);
        }
    }, [currentStep, formData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // FORM DATA UPDATE
    // ═══════════════════════════════════════════════════════════════════════════
    const updateFormData = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION - WITH MANDATORY TRUST SHIELD GUARD
    // ═══════════════════════════════════════════════════════════════════════════
    const nextStep = useCallback(() => {
        // 🛡️ CRITICAL GUARD: Cannot proceed from Step 5 to Step 6 without Trust Shield verification
        if (currentStep === 5) {
            const isVerified = formData.trustShieldStatus === 'VERIFIED' || 
                               formData.trustShieldStatus === 'VERIFIED_MINOR';
            const hasFaceScore = formData.trustShieldFaceScore && formData.trustShieldFaceScore >= 0.5;
            const hasOCR = formData.trustShieldOCR && formData.trustShieldOCR.dob && formData.trustShieldOCR.name;
            
            if (!isVerified) {
                setError('❌ TRUST SHIELD REQUIRED: You must complete face verification before continuing.');
                return;
            }
            
            if (!hasFaceScore) {
                setError('❌ FACE VERIFICATION INCOMPLETE: Liveness check required.');
                return;
            }
            
            if (!hasOCR) {
                setError('❌ ID VERIFICATION MISSING: Please upload and verify your ID.');
                return;
            }
            
            console.log('[Onboarding] ✅ Trust Shield verification confirmed - proceeding to Step 6');
        }
        
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            completeOnboarding();
        }
    }, [currentStep, formData.trustShieldStatus, formData.trustShieldFaceScore, formData.trustShieldOCR]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStep]);

    const resetStep = useCallback(() => {
        setCurrentStep(1);
        setFormData({ ...DEFAULT_FORM_DATA });
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TIMESTAMP_KEY);
        console.log('[Onboarding] Reset to step 1');
    }, []);

    const goToStep = useCallback((step) => {
        if (step >= 1 && step <= TOTAL_STEPS) {
            setCurrentStep(step);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPLETE ONBOARDING - With retry logic and better error handling
    // ═══════════════════════════════════════════════════════════════════════════
    const completeOnboarding = useCallback(async (attempt = 1, maxAttempts = 3) => {
        if (!user) {
            setError('User not authenticated. Please log in again.');
            return;
        }
        
        // 🛡️ CRITICAL GUARD: Cannot create account without Trust Shield verification
        const isVerified = formData.trustShieldStatus === 'VERIFIED' || 
                           formData.trustShieldStatus === 'VERIFIED_MINOR';
        const hasFaceScore = formData.trustShieldFaceScore && formData.trustShieldFaceScore >= 0.5;
        const hasOCR = formData.trustShieldOCR && formData.trustShieldOCR.dob && formData.trustShieldOCR.name;
        
        if (!isVerified) {
            setError('❌ ACCOUNT CREATION BLOCKED: Trust Shield verification is mandatory. Complete Step 5 first.');
            setIsSubmitting(false);
            // Force back to Step 5
            setCurrentStep(5);
            return;
        }
        
        if (!hasFaceScore) {
            setError('❌ ACCOUNT CREATION BLOCKED: Face liveness check incomplete. Complete Step 5 first.');
            setIsSubmitting(false);
            setCurrentStep(5);
            return;
        }
        
        if (!hasOCR) {
            setError('❌ ACCOUNT CREATION BLOCKED: ID verification missing. Complete Step 5 first.');
            setIsSubmitting(false);
            setCurrentStep(5);
            return;
        }
        
        console.log('[Onboarding] 🛡️ All Trust Shield guards passed - proceeding with account creation');
        
        setIsSubmitting(true);
        setError(null);

        try {
            let avatarUrl = null;

            // Upload avatar if provided
            if (formData.avatarFile) {
                try {
                    avatarUrl = await uploadImage(formData.avatarFile, user.id);
                } catch (uploadErr) {
                    console.warn('[Onboarding] Avatar upload failed:', uploadErr);
                    // Continue without avatar
                }
            } else if (user.user_metadata?.avatar_url) {
                // Use OAuth avatar if available
                avatarUrl = user.user_metadata.avatar_url;
            }

            // Validate avatar URL
            if (avatarUrl && avatarUrl.startsWith('data:image')) {
                avatarUrl = null; // Prevent massive base64 payload
            }

            // Prepare profile data
            const updatedProfileData = {
                username: formData.username,
                full_name: formData.full_name,
                bio: formData.bio,
                website: formData.website,
                avatar_url: avatarUrl,
                onboarding_completed: true,
                verification_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
                trust_shield_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
                identity_hash: formData.identityHash || null,
                age_tier: formData.ageTier,
                age_verified: formData.ageVerified,
            };

            // Update local state immediately
            if (updateAuthProfile) updateAuthProfile(updatedProfileData);
            if (updateFocusProfile) updateFocusProfile(updatedProfileData);

            // Trust Shield data
            const trustShieldData = {
                verification_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
                trust_shield_status: formData.trustShieldStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
                identity_hash: formData.identityHash || null,
                guardian_handshake_link: formData.guardianHandshakeLink || null,
            };

            // ═══════════════════════════════════════════════════════════════════
            // SAVE DATA WITH RETRY LOGIC
            // ═══════════════════════════════════════════════════════════════════
            const saveWithRetry = async (retries = 3, delay = 2000) => {
                for (let i = 0; i < retries; i++) {
                    try {
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
                            setTimeout(() => reject(new Error('Request timed out')), 15000)
                        );

                        await Promise.race([savePromise, timeoutPromise]);
                        
                        // Success - break out of retry loop
                        console.log(`[Onboarding] Save succeeded on attempt ${i + 1}`);
                        return true;
                        
                    } catch (err) {
                        console.warn(`[Onboarding] Save attempt ${i + 1} failed:`, err.message);
                        
                        if (i < retries - 1) {
                            // Wait before retry (exponential backoff)
                            await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
                        } else {
                            // All retries failed
                            throw err;
                        }
                    }
                }
                return false;
            };

            await saveWithRetry();

            // ═══════════════════════════════════════════════════════════════════
            // CREATE FOLLOWS
            // ═══════════════════════════════════════════════════════════════════
            if (formData.followedUsers && formData.followedUsers.length > 0) {
                try {
                    const { supabase } = await import('../lib/supabase');
                    
                    // Batch insert follows
                    const followInserts = formData.followedUsers.map(followingId => ({
                        follower_id: user.id,
                        following_id: followingId,
                        created_at: new Date().toISOString()
                    }));

                    const { error: followError } = await supabase
                        .from('follows')
                        .insert(followInserts);
                    
                    if (followError) {
                        console.warn('[Onboarding] Follow creation failed:', followError);
                    }

                    // Create notifications
                    const notificationInserts = formData.followedUsers.map(followingId => ({
                        user_id: followingId,
                        type: 'follow',
                        actor_id: user.id,
                        is_read: false,
                        created_at: new Date().toISOString()
                    }));

                    const { error: notifError } = await supabase
                        .from('notifications')
                        .insert(notificationInserts);
                    
                    if (notifError) {
                        console.warn('[Onboarding] Notification creation failed:', notifError);
                    }
                } catch (err) {
                    console.warn('[Onboarding] Follow/notification error (non-critical):', err);
                }
            }

            // ═══════════════════════════════════════════════════════════════════
            // NOTIFICATIONS PERMISSION
            // ═══════════════════════════════════════════════════════════════════
            if (formData.notificationsEnabled && 'Notification' in window) {
                try {
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
                } catch (err) {
                    console.warn('[Onboarding] Notification permission error:', err);
                }
            }

            // ═══════════════════════════════════════════════════════════════════
            // REFRESH & NAVIGATE
            // ═══════════════════════════════════════════════════════════════════
            if (refreshProfile) {
                await refreshProfile();
            }

            // Clear onboarding storage
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TIMESTAMP_KEY);

            console.log('[Onboarding] Complete! Navigating to home...');
            setIsSubmitting(false);
            
            // Use replace to prevent going back to onboarding
            navigate('/home', { replace: true });
            
        } catch (err) {
            console.error('[Onboarding] Error:', err);
            
            // If we haven't exceeded max attempts, retry
            if (attempt < maxAttempts) {
                console.log(`[Onboarding] Retrying... attempt ${attempt + 1}/${maxAttempts}`);
                setError(`Save failed. Retrying... (${attempt}/${maxAttempts})`);
                
                setTimeout(() => {
                    completeOnboarding(attempt + 1, maxAttempts);
                }, 2000 * attempt); // Exponential backoff
                
                return;
            }
            
            // All attempts failed - check if it's a non-critical error
            if (
                err.message?.includes('user_interests') ||
                err.message?.includes('42P01') || // Missing table
                err.message?.includes('timeout') ||
                err.code === '42P01'
            ) {
                console.warn('[Onboarding] Non-critical error, proceeding anyway:', err.message);
                
                // Clear storage and proceed
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(TIMESTAMP_KEY);
                
                setIsSubmitting(false);
                navigate('/home', { replace: true });
            } else {
                setError(err.message || 'Failed to save profile. Please try again.');
                setIsSubmitting(false);
            }
        }
    }, [user, formData, updateAuthProfile, updateFocusProfile, refreshProfile, navigate]);

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEAR ERROR
    // ═══════════════════════════════════════════════════════════════════════════
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // RETURN
    // ═══════════════════════════════════════════════════════════════════════════
    return {
        currentStep,
        totalSteps: TOTAL_STEPS,
        formData,
        updateFormData,
        nextStep,
        prevStep,
        resetStep,
        goToStep,
        completeOnboarding,
        isSubmitting,
        error,
        clearError,
        isRestored,
        user
    };
};

export default useOnboardingPersistent;
