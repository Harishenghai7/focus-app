/**
 * SessionManager — Focus App Settings
 *
 * Displays active OAuth sessions and provides "Sign out from all devices".
 * Used inside the Account section of Settings.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSessions';
import UserAvatar from '../ui/Avatar';
import { useFocusIdentity } from '../../context/FocusIdentityContext';
import styles from './SessionManager.module.css';

const SESSION_ICONS = {
    google: '🔵',
    github: '⚫',
    azure: '🔷',
    microsoft: '🟦',
    default: '🌐',
};

const getProviderIcon = (provider = '') => {
    const p = provider.toLowerCase();
    return SESSION_ICONS[p] || SESSION_ICONS.default;
};

const SessionManager = () => {
    const { signOut } = useAuth();
    const { avatarUrl, displayName, handle } = useFocusIdentity();
    const { sessions = [], loading, endSession } = useSessions();
    const navigate = useNavigate();
    const [signingOutAll, setSigningOutAll] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const handleSignOutAll = useCallback(async () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }

        setSigningOutAll(true);
        try {
            await supabase.auth.signOut({ scope: 'global' });
            navigate('/auth', { replace: true });
        } catch (err) {
            console.error('Global sign out error:', err);
            setSigningOutAll(false);
            setConfirming(false);
        }
    }, [confirming, navigate]);

    const handleSignOutThis = useCallback(async () => {
        await signOut();
        navigate('/auth', { replace: true });
    }, [signOut, navigate]);

    return (
        <div className={styles.container}>
            {/* Current identity */}
            <div className={styles.identityCard}>
                <UserAvatar
                    src={avatarUrl}
                    username={handle}
                    fullName={displayName}
                    size="lg"
                    eager
                />
                <div className={styles.identityInfo}>
                    <span className={styles.identityName}>{displayName}</span>
                    <span className={styles.identityHandle}>@{handle}</span>
                    <span className={styles.oauthBadge}>🔐 OAuth Only — Secure</span>
                </div>
            </div>

            {/* Active sessions */}
            {!loading && sessions.length > 0 && (
                <div className={styles.sessionsBlock}>
                    <p className={styles.sectionLabel}>Linked OAuth Providers</p>
                    <div className={styles.sessionList}>
                        {sessions.map((session, i) => (
                            <div key={session.id || i} className={styles.sessionItem}>
                                <span className={styles.sessionIcon}>
                                    {getProviderIcon(session.provider)}
                                </span>
                                <div className={styles.sessionDetails}>
                                    <span className={styles.sessionProvider}>
                                        {session.provider || 'OAuth'}
                                    </span>
                                    {session.created_at && (
                                        <span className={styles.sessionDate}>
                                            Connected {new Date(session.created_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                {session.is_current ? (
                                    <span className={styles.sessionActive}>Current</span>
                                ) : (
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => endSession(session.id)}
                                    >
                                        Kill
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sign out actions */}
            <div className={styles.actions}>
                <button
                    className={styles.signOutBtn}
                    onClick={handleSignOutThis}
                >
                    <span>🚪</span>
                    Sign out this device
                </button>

                <button
                    className={[styles.signOutAllBtn, confirming ? styles.confirmState : ''].join(' ')}
                    onClick={handleSignOutAll}
                    disabled={signingOutAll}
                >
                    {signingOutAll ? (
                        <>⏳ Signing out…</>
                    ) : confirming ? (
                        <>⚠️ Tap again to confirm — this signs out all devices</>
                    ) : (
                        <>🔴 Sign out from all devices</>
                    )}
                </button>

                {confirming && !signingOutAll && (
                    <button
                        className={styles.cancelBtn}
                        onClick={() => setConfirming(false)}
                    >
                        Cancel
                    </button>
                )}
            </div>

            <p className={styles.securityNote}>
                🛡️ Focus uses OAuth-only authentication. Your passwords are never stored on our servers.
            </p>
        </div>
    );
};

export default SessionManager;
