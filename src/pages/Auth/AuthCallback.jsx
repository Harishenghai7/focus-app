import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { syncOAuthAvatar } from '../../utils/avatarManager';
import styles from './Auth.module.css';

/**
 * OAuth Callback Handler
 * Handles the redirect after OAuth authentication
 * Checks if profile exists → routes to /home or /onboarding
 */
const AuthCallback = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('Processing authentication...');
    const [error, setError] = useState(null);

    useEffect(() => {
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

                setStatus('Setting up your session...');

                // Set the session
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || '',
                });

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setError('Failed to establish session');
                    setTimeout(() => navigate('/auth'), 3000);
                    return;
                }

                const user = sessionData.user;
                if (!user) {
                    setError('No user data received');
                    setTimeout(() => navigate('/auth'), 3000);
                    return;
                }

                setStatus('Checking your profile...');

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

                // Route based on profile state
                if (!profile) {
                    // No profile exists → new user → onboarding

                    setStatus('Welcome! Setting up your profile...');
                    setTimeout(() => navigate('/onboarding', { replace: true }), 500);
                } else if (!profile.onboarding_completed) {
                    // Profile exists but onboarding not complete → resume onboarding

                    setStatus('Resuming your setup...');
                    setTimeout(() => navigate('/onboarding', { replace: true }), 500);
                } else {
                    // Profile complete → go to home

                    setStatus('Welcome back! Loading your feed...');
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
                        <div className={styles.spinner}></div>
                        <h2 className={styles.statusTitle}>{status}</h2>
                        <p className={styles.statusMessage}>Please wait...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
