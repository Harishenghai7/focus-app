import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export const useVerifications = () => {
    const { user } = useAuth();
    const [verifications, setVerifications] = useState({
        email: false,
        profile: false,
        oauth: false,
        biometric: false
    });
    const [loading, setLoading] = useState({});

    const checkVerifications = () => {
        const hasEmail = !!user.email_confirmed_at;

        // Check profile completeness
        const meta = user.user_metadata || {};
        const hasProfile = !!(meta.avatar_url && meta.bio && meta.full_name);

        // Check OAuth (identities array)
        const identities = user.identities || [];
        const hasOAuth = identities.some(id => id.provider !== 'email');

        // Check Biometric (stored in metadata or local preference for now)
        const hasBiometric = localStorage.getItem('biometric_lock_enabled') === 'true';

        setVerifications({
            email: hasEmail,
            profile: hasProfile,
            oauth: hasOAuth,
            biometric: hasBiometric
        });
    };

    useEffect(() => {
        if (user) {
            checkVerifications();
        }
    }, [user]);

    const verifyStep = async (stepId, params = {}) => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }
        setLoading(prev => ({ ...prev, [stepId]: true }));

        try {
            switch (stepId) {
                case 'email':
                    // Trigger email verification resend
                    if (!user.email_confirmed_at) {
                        const { error } = await supabase.auth.resend({
                            type: 'signup',
                            email: user.email,
                        });
                        if (error) throw error;
                        return { success: true, message: 'Verification email sent!' };
                    }
                    break;

                case 'oauth':
                    // Initiate OAuth flow
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: params.provider,
                        options: {
                            redirectTo: window.location.origin + '/verification-center'
                        }
                    });
                    if (error) throw error;
                    break;

                case 'biometric':
                    // Register WebAuthn credential
                    if (!window.PublicKeyCredential) {
                        throw new Error('Biometrics not supported');
                    }

                    // Create challenge
                    const challenge = new Uint8Array(32);
                    window.crypto.getRandomValues(challenge);

                    const credential = await navigator.credentials.create({
                        publicKey: {
                            challenge,
                            rp: { name: 'Focus App' },
                            user: {
                                id: Uint8Array.from(user.id.split('').map(c => c.charCodeAt(0))),
                                name: user.email,
                                displayName: user.user_metadata?.full_name || user.email
                            },
                            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                            authenticatorSelection: {
                                authenticatorAttachment: 'platform',
                                userVerification: 'required'
                            },
                            timeout: 60000
                        }
                    });

                    if (credential) {
                        localStorage.setItem('biometric_lock_enabled', 'true');
                        // Also update user metadata to reflect this for trust score
                        await supabase.auth.updateUser({
                            data: { biometric_enabled: true }
                        });
                        checkVerifications();
                        return { success: true, message: 'Biometric lock enabled!' };
                    }
                    break;

                default:
                    break;
            }
        } catch (error) {
            console.error('Verification error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(prev => ({ ...prev, [stepId]: false }));
        }
    };

    return { verifications, verifyStep, loading };
};
