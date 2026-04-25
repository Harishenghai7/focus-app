/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔥 LAYER 4: PROTECTED TRUST ROUTE - God-Level Security Hardening
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * If session exists but profile.verification_status !== 'VERIFIED',
 * user is LOCKED into /onboarding. All other URLs redirect here.
 * 
 * Features:
 * - Real-time verification status monitoring
 * - Strict route enforcement
 * - Anti-tamper protection
 * - Automatic redirect to onboarding if unverified
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFocusUser } from '../../context/FocusUserContext';
import { supabase } from '../../lib/supabase';

const LoadingScreen = () => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)' 
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid rgba(139, 92, 246, 0.3)', 
                borderTop: '3px solid #8b5cf6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
            }} />
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Verifying Trust Shield...</p>
        </div>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

const ProtectedTrustRoute = ({ children }) => {
    const { user, profile, loading } = useFocusUser();
    const location = useLocation();
    const [verificationState, setVerificationState] = useState({
        isChecking: true,
        isVerified: false,
        isLocked: false
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // REAL-TIME VERIFICATION STATUS MONITORING
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!user?.id) {
            setVerificationState({ isChecking: false, isVerified: false, isLocked: false });
            return;
        }

        // Initial check
        checkVerificationStatus();

        // Subscribe to real-time profile changes
        const channel = supabase
            .channel(`trust-shield-guard:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`,
            }, (payload) => {
                console.log('[ProtectedTrustRoute] 🔄 Profile updated:', payload);
                checkVerificationStatus();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const checkVerificationStatus = async () => {
        if (!user?.id) return;

        try {
            // Fetch fresh data from Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select('verification_status, verification_step, onboarding_completed')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('[ProtectedTrustRoute] Error fetching profile:', error);
                setVerificationState({ isChecking: false, isVerified: false, isLocked: true });
                return;
            }

            const status = (data?.verification_status || '').toUpperCase().trim();
            const isVerified = status === 'VERIFIED' || status === 'VERIFIED_MINOR';
            
            // If onboarding shows complete but not verified, treat as unverified
            const onboardingDone = data?.onboarding_completed === true;
            const isLocked = !isVerified;

            console.log('[ProtectedTrustRoute] 🔒 Status check:', {
                status,
                isVerified,
                isLocked,
                step: data?.verification_step
            });

            setVerificationState({
                isChecking: false,
                isVerified,
                isLocked
            });

            // If onboarding done but not verified, reset it
            if (onboardingDone && !isVerified) {
                console.warn('[ProtectedTrustRoute] 🚨 Onboarding complete but not verified - resetting');
                await supabase
                    .from('profiles')
                    .update({ 
                        onboarding_completed: false,
                        verification_status: 'PENDING'
                    })
                    .eq('id', user.id);
            }

        } catch (err) {
            console.error('[ProtectedTrustRoute] Check error:', err);
            setVerificationState({ isChecking: false, isVerified: false, isLocked: true });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER STATES
    // ═══════════════════════════════════════════════════════════════════════════

    // Show loading while checking
    if (loading || verificationState.isChecking) {
        return <LoadingScreen />;
    }

    // Not logged in - let the route handle it
    if (!user) {
        return children;
    }

    // Define exempt paths (always accessible even if unverified)
    const EXEMPT_PATHS = [
        '/onboarding',
        '/auth',
        '/verification',
        '/verify-mobile',
        '/support',
        '/security',
        '/parent-consent',
        '/guardian-verify'
    ];

    const isExempt = EXEMPT_PATHS.some((p) => location.pathname.startsWith(p));

    // Exempt paths are always allowed
    if (isExempt) {
        return children;
    }

    // 🛡️ CRITICAL: If not verified, LOCK the user into onboarding
    if (verificationState.isLocked) {
        console.warn('[ProtectedTrustRoute] 🚫 ACCESS DENIED:', location.pathname);
        console.warn('[ProtectedTrustRoute] 🔒 Redirecting to /onboarding - Trust Shield required');
        
        // Show a toast or notification
        if (window.showNotification) {
            window.showNotification({
                type: 'warning',
                message: '🔒 Trust Shield verification required to access this page',
                duration: 5000
            });
        }

        return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
    }

    // User is verified - allow access
    return children;
};

// Higher-order component version for easy wrapping
export const withTrustProtection = (Component) => {
    return (props) => (
        <ProtectedTrustRoute>
            <Component {...props} />
        </ProtectedTrustRoute>
    );
};

export default ProtectedTrustRoute;
