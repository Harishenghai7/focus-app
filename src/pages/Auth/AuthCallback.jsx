import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { syncOAuthAvatar } from '../../utils/avatarManager';
import styles from './Auth.module.css';
import focusLogo from '../../assets/focus-logo.png';

const STATUS_SEQUENCE = [
    { text: 'Authenticating identity...', phase: 0 },
    { text: 'Establishing secure session...', phase: 1 },
    { text: 'Loading your universe...', phase: 2 },
];

/**
 * OAuth Callback Handler — Branded Ceremony
 * Handles the redirect after OAuth authentication with a cinematic loading experience.
 * Checks if profile exists → routes to /home or /onboarding
 */
const AuthCallback = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(STATUS_SEQUENCE[0].text);
    const [phase, setPhase] = useState(0);
    const [error, setError] = useState(null);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const handleOAuthCallback = async () => {
            try {
                // Get the hash parameters from URL
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const errorParam = hashParams.get('error');
                const errorDescription = hashParams.get('error_description');

                // Handle OAuth errors
                if (errorParam) {
                    console.error('OAuth error:', errorParam, errorDescription);
                    setError(errorDescription || 'Authentication failed');
                    setTimeout(() => navigate('/auth'), 3000);
                    return;
                }

                // Validate tokens
                if (!accessToken) {
                    console.error('No access token found in URL');
                    setError('No authentication token received');
                    setTimeout(() => navigate('/auth'), 3000);
                    return;
                }

                // Phase 1: Setting up session
                await new Promise(r => setTimeout(r, 600));
                setPhase(1);
                setStatus(STATUS_SEQUENCE[1].text);

                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || '',
                });

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setError('Failed to establish secure session');
                    setTimeout(() => navigate('/auth'), 3000);
                    return;
                }

                const user = sessionData.user;
                if (!user) {
                    setError('No user data received');
                    setTimeout(() => navigate('/auth'), 3000);
                    return;
                }

                // Phase 2: Loading universe
                setPhase(2);
                setStatus(STATUS_SEQUENCE[2].text);

                // Check if profile exists and is complete
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, username, onboarding_completed')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Profile check error:', profileError);
                }

                // Sync OAuth avatar in background
                syncOAuthAvatar(user.id).catch(err =>
                    console.warn('Avatar sync failed (non-blocking):', err)
                );

                // Brief pause for ceremony feel
                await new Promise(r => setTimeout(r, 800));

                // Route based on profile state
                if (!profile) {
                    setStatus('Welcome! Preparing your journey...');
                    setTimeout(() => navigate('/onboarding', { replace: true }), 500);
                } else if (!profile.onboarding_completed) {
                    setStatus('Resuming your setup...');
                    setTimeout(() => navigate('/onboarding', { replace: true }), 500);
                } else {
                    setStatus('Welcome back!');
                    setTimeout(() => navigate('/home', { replace: true }), 500);
                }

            } catch (err) {
                console.error('OAuth callback error:', err);
                setError(err.message || 'An unexpected error occurred');
                setTimeout(() => navigate('/auth'), 3000);
            }
        };

        handleOAuthCallback();
    }, [navigate]);

    return (
        <div className={styles.callbackContainer}>
            <div className={styles.callbackContent}>
                {error ? (
                    <>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h2 className={styles.errorTitle}>Authentication Error</h2>
                        <p className={styles.errorMessage}>{error}</p>
                        <p className={styles.redirectMessage}>Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        {/* Animated logo with orbital ring */}
                        <div className={styles.callbackLogoWrapper}>
                            <div className={styles.callbackLogoGlow} />
                            <div className={styles.callbackLogoRing} />
                            <img src={focusLogo} alt="Focus" className={styles.callbackLogo} />
                        </div>

                        {/* Status text */}
                        <h2 className={styles.statusTitle}>{status}</h2>

                        {/* Phase progress dots */}
                        <div className={styles.callbackProgress}>
                            {STATUS_SEQUENCE.map((s, i) => (
                                <span
                                    key={i}
                                    className={`${styles.callbackProgressDot} ${i <= phase ? 'active' : ''}`}
                                    style={{
                                        background: i <= phase ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)',
                                        boxShadow: i <= phase ? '0 0 8px rgba(139, 92, 246, 0.5)' : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        <p className={styles.statusMessage}>Securing your connection...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
