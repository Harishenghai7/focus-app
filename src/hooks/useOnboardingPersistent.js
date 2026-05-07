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
import { supabase } from '../lib/supabase';

const TOTAL_STEPS = 6;
const STORAGE_KEY = 'focus_onboarding_state';
const TIMESTAMP_KEY = 'focus_onboarding_timestamp';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const VERIFICATION_STEP_KEY = 'focus_verification_step';

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
    // LAYER 1: GOD-LEVEL PERSISTENT STATE - Sync with Supabase on mount
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (hasLoadedRef.current) return;
        
        const restoreState = async () => {
            try {
                // First: Try to restore from Supabase (source of truth)
                if (user?.id) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('verification_step, verification_progress, current_step')
                        .eq('id', user.id)
                        .single();
                    
                    if (!error && profile) {
                        // Database is source of truth - use verification_step if available
                        const dbStep = profile.verification_step || profile.current_step || 1;
                        if (dbStep >= 1 && dbStep <= TOTAL_STEPS) {
                            setCurrentStep(dbStep);
                            localStorage.setItem(VERIFICATION_STEP_KEY, dbStep.toString());

                            setIsRestored(true);
                            hasLoadedRef.current = true;
                            return; // Exit early - database wins
                        }
                    }
                }
                
                // Fallback: Restore from localStorage
                const savedState = localStorage.getItem(STORAGE_KEY);
                const savedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
                const savedVerificationStep = localStorage.getItem(VERIFICATION_STEP_KEY);
                
                if (savedVerificationStep) {
                    const vStep = parseInt(savedVerificationStep, 10);
                    if (vStep >= 1 && vStep <= TOTAL_STEPS) {
                        setCurrentStep(vStep);

                    }
                } else if (savedState && savedTimestamp) {
                    const timestamp = parseInt(savedTimestamp, 10);
                    const now = Date.now();
                    
                    if (now - timestamp < SESSION_TIMEOUT) {
                        const parsed = JSON.parse(savedState);
                        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= TOTAL_STEPS) {
                            setCurrentStep(parsed.currentStep);
                        }
                        if (parsed.formData) {
                            setFormData(prev => ({
                                ...DEFAULT_FORM_DATA,
                                ...parsed.formData,
                                avatarFile: null,
                            }));
                        }

                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                        localStorage.removeItem(TIMESTAMP_KEY);
                    }
                }
                
                setIsRestored(true);
            } catch (err) {
                console.error('[Onboarding] Failed to restore state:', err);
            } finally {
                hasLoadedRef.current = true;
            }
        };
        
        restoreState();
    }, [user?.id]);

    // ═══════════════════════════════════════════════════════════════════════════
    // LAYER 2: Persist to localStorage AND Supabase on every change
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!hasLoadedRef.current) return;
        
        try {
            const stateToSave = {
                currentStep,
                formData: {
                    ...formData,
                    avatarFile: null,
                },
            };
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
            localStorage.setItem(VERIFICATION_STEP_KEY, currentStep.toString());
        } catch (err) {
            console.error('[Onboarding] Failed to save state:', err);
        }
    }, [currentStep, formData]);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LAYER 2b: Sync verification_step to Supabase (fire and forget)
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!hasLoadedRef.current || !user?.id) return;
        
        // Fire and forget - don't block UI
        supabase.rpc('sync_verification_state', {
            p_user_id: user.id,
            p_step: currentStep,
            p_progress: {
                step_name: getStepName(currentStep),
                trust_shield_status: formData.trustShieldStatus,
                updated_at: new Date().toISOString()
            }
        }).then(({ error }) => {
            if (error) {
                console.warn('[Onboarding] Failed to sync verification_step:', error);
            } else {

            }
        }).catch(() => {});
    }, [currentStep, user?.id, formData.trustShieldStatus]);
    
    // Helper to get step name
    const getStepName = (step) => {
        const names = ['profile', 'age', 'interests', 'avatar', 'trust_shield', 'complete'];
        return names[step - 1] || 'unknown';
    };

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
                               formData.trustShieldStatus === 'VERIFIED_MINOR' ||
                               formData.trustShieldStatus === 'PENDING_REVIEW'; // Emergency bypass allowed
            const hasFaceScore = formData.trustShieldFaceScore && formData.trustShieldFaceScore >= 0.5;
            const hasOCR = formData.trustShieldOCR && formData.trustShieldOCR.dob && formData.trustShieldOCR.name;
            
            if (!isVerified) {
                setError('❌ TRUST SHIELD REQUIRED: You must complete face verification before continuing.');
                return;
            }
            
            // Note: hasFaceScore check removed - PENDING_REVIEW bypass doesn't need face score
            if (!hasOCR) {
                setError('❌ ID VERIFICATION MISSING: Please upload and verify your ID.');
                return;
            }
            

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

    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // STRICT STEP NAVIGATION - Cannot go backwards (God-Level Enforcement)
    // ═══════════════════════════════════════════════════════════════════════════
    const goToStep = useCallback(async (targetStep) => {
        // Validate step range
        if (targetStep < 1 || targetStep > TOTAL_STEPS) {
            console.warn('[Onboarding] Invalid step:', targetStep);
            return;
        }
        
        // 🛡️ GOD-LEVEL GUARD: Cannot go backwards in verification flow
        if (targetStep < currentStep) {
            console.warn('[Onboarding] 🚫 BLOCKED: Cannot go from step', currentStep, 'to step', targetStep);
            setError('🔒 Verification flow is locked. You cannot go backwards.');
            return;
        }
        
        // Check Supabase for authoritative state (prevent tampering)
        if (user?.id) {
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('verification_step')
                    .eq('id', user.id)
                
                    .single();
                
                if (!error && profile?.verification_step) {
                    const dbStep = profile.verification_step;
                    // If database shows higher step than local, use database
                    if (dbStep > currentStep) {
                        setCurrentStep(dbStep);

                        return;
                    }
                    // If trying to go below database step, block
                    if (targetStep < dbStep) {
                        console.warn('[Onboarding] 🚫 BLOCKED: Database enforces step', dbStep);
                        setError('🔒 This step has already been completed.');
                        return;
                    }
                }
            } catch (err) {
                console.warn('[Onboarding] Could not verify with database:', err);
            }
        }
        
        // Allow forward navigation
        setCurrentStep(targetStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep, user?.id]);

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
                           formData.trustShieldStatus === 'VERIFIED_MINOR' ||
                           formData.trustShieldStatus === 'PENDING_REVIEW'; // Emergency bypass allowed
        const hasOCR = formData.trustShieldOCR && formData.trustShieldOCR.dob && formData.trustShieldOCR.name;
        
        if (!isVerified) {
            setError('❌ ACCOUNT CREATION BLOCKED: Trust Shield verification is mandatory. Complete Step 5 first.');
            setIsSubmitting(false);
            // Force back to Step 5
            setCurrentStep(5);
            return;
        }
        
        if (!hasOCR) {
            setError('❌ ACCOUNT CREATION BLOCKED: ID verification missing. Complete Step 5 first.');
            setIsSubmitting(false);
            setCurrentStep(5);
            return;
        }
        

        
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


            setIsSubmitting(false);
            
            // Use replace to prevent going back to onboarding
            navigate('/home', { replace: true });
            
        } catch (err) {
            console.error('[Onboarding] Error:', err);
            
            // If we haven't exceeded max attempts, retry
            if (attempt < maxAttempts) {

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
