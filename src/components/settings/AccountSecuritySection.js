import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaFingerprint, FaMobile, FaDesktop, FaSignOutAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useTrustScore } from '../../hooks/useTrustScore';
import { useVerifications } from '../../hooks/useVerifications';
import { useFocusIdentity } from '../../context/FocusIdentityContext';
import { useSessions } from '../../hooks/useSessions';
import { supabase } from '../../lib/supabase';
import { focusToast } from '../../utils/focusToast';
import { triggerHaptic } from '../../utils/haptics';
import TrustScoreCard from '../trustShield/TrustScoreCard';
import UserAvatar from '../ui/Avatar';
import sovereignStyles from './SovereignSettings.module.css';
import styles from './AccountSecuritySection.module.css';

/**
 * Province 1: Account & Security
 * 
 * Sovereign Control Center - Trust Shield, Biometrics, Session Management
 * Critical security operations require biometric challenge
 */
const AccountSecuritySection = ({ 
    settings, 
    onUpdateSetting,
    onDeleteAccount 
}) => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { score, loading: scoreLoading } = useTrustScore(user);
    const { verifications } = useVerifications();
    const { avatarUrl, displayName, handle, email } = useFocusIdentity();
    const { sessions = [], loading: sessionsLoading, endSession } = useSessions();

    const [showingBiometricChallenge, setShowingBiometricChallenge] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [biometricEnabled, setBiometricEnabled] = useState(() => 
        localStorage.getItem('biometric_lock_enabled') === 'true'
    );
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Get verification status
    const verificationStatus = verifications?.[0]?.status || 'unverified';
    const isVerified = verificationStatus === 'verified' || verificationStatus === 'VERIFIED';

    // Handle sensitive action with biometric challenge
    const handleSensitiveAction = useCallback((action) => {
        setPendingAction(action);
        setShowingBiometricChallenge(true);
        triggerHaptic('heavy');
    }, []);

    // Execute biometric verification
    const executeBiometricChallenge = useCallback(async () => {
        try {
            if (!window.PublicKeyCredential) {
                throw new Error('Biometric authentication not supported');
            }

            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: 'required',
                },
            });

            if (credential) {
                setShowingBiometricChallenge(false);
                
                // Execute pending action
                if (pendingAction === 'delete') {
                    setShowDeleteConfirm(true);
                } else if (pendingAction === 'logout-all') {
                    handleSignOutAll();
                }
                
                setPendingAction(null);
                return true;
            }
        } catch (err) {
            console.error('Biometric challenge failed:', err);
            focusToast.error('Authentication failed. Please try again.');
            setShowingBiometricChallenge(false);
            setPendingAction(null);
            return false;
        }
    }, [pendingAction]);

    // Toggle biometric lock
    const toggleBiometric = useCallback(async () => {
        const newValue = !biometricEnabled;
        
        if (newValue) {
            // Enabling - test biometric first
            try {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);

                await navigator.credentials.get({
                    publicKey: {
                        challenge,
                        timeout: 60000,
                        userVerification: 'required',
                    },
                });

                localStorage.setItem('biometric_lock_enabled', 'true');
                setBiometricEnabled(true);
                onUpdateSetting?.('biometric_lock_enabled', true);
                focusToast.success('Biometric lock enabled');
            } catch (err) {
                focusToast.error('Biometric setup failed');
            }
        } else {
            // Disabling - require biometric to turn off
            handleSensitiveAction('disable-biometric');
            localStorage.setItem('biometric_lock_enabled', 'false');
            setBiometricEnabled(false);
            onUpdateSetting?.('biometric_lock_enabled', false);
            focusToast.info('Biometric lock disabled');
        }
    }, [biometricEnabled, onUpdateSetting, handleSensitiveAction]);

    // Sign out from all devices
    const handleSignOutAll = useCallback(async () => {
        try {
            await supabase.auth.signOut({ scope: 'global' });
            navigate('/auth', { replace: true });
            focusToast.success('Signed out from all devices');
        } catch (err) {
            focusToast.error('Failed to sign out');
        }
    }, [navigate]);

    // Delete account
    const handleDeleteAccount = useCallback(async () => {
        if (deleteConfirmText !== 'DELETE') {
            focusToast.error('Please type DELETE to confirm');
            return;
        }

        setIsDeleting(true);
        try {
            // Call Supabase function to scrub all data
            const { error } = await supabase.rpc('delete_user_account', {
                user_id: user.id
            });

            if (error) throw error;

            focusToast.success('Your account has been permanently deleted');
            await signOut();
            navigate('/auth', { replace: true });
        } catch (err) {
            console.error('Account deletion failed:', err);
            focusToast.error('Failed to delete account. Please contact support.');
            setIsDeleting(false);
        }
    }, [deleteConfirmText, user, signOut, navigate]);

    // Get device icon
    const getDeviceIcon = (session) => {
        const provider = session.provider?.toLowerCase() || '';
        if (provider.includes('mobile') || provider.includes('ios') || provider.includes('android')) {
            return <FaMobile />;
        }
        return <FaDesktop />;
    };

    // Get current session
    const currentSession = sessions.find(s => s.is_current);
    const otherSessions = sessions.filter(s => !s.is_current);

    return (
        <div className={sovereignStyles.slideIn}>
            {/* Trust Shield Status */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaShieldAlt />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Trust Shield</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Your digital identity protection
                        </p>
                    </div>
                </div>

                <div className={styles.trustShieldContent}>
                    <TrustScoreCard score={score} loading={scoreLoading} compact />
                    
                    <div className={styles.verificationStatus}>
                        <span className={`${sovereignStyles.trustShieldBadge} ${
                            isVerified ? sovereignStyles.verified : 
                            verificationStatus === 'pending' ? sovereignStyles.pending : 
                            sovereignStyles.unverified
                        }`}>
                            <FaShieldAlt />
                            {isVerified ? 'Verified' : verificationStatus === 'pending' ? 'Pending' : 'Unverified'}
                        </span>
                        
                        {!isVerified && (
                            <button 
                                className={sovereignStyles.biometricButton}
                                onClick={() => navigate('/verification/trust-shield')}
                            >
                                <FaShieldAlt />
                                Secure Your Identity Now
                            </button>
                        )}
                        
                        {isVerified && (
                            <button 
                                className={`${sovereignStyles.biometricButton} ${sovereignStyles.secondary}`}
                                onClick={() => navigate('/security')}
                            >
                                View Security Center
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Biometric Security */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaFingerprint />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Biometric Lock</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Face ID / Fingerprint protection
                        </p>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaFingerprint className={sovereignStyles.satinIcon} />
                            Enable Biometric Lock
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Require Face ID or fingerprint to open the app
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${biometricEnabled ? sovereignStyles.active : ''}`}
                            onClick={toggleBiometric}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Sessions */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaDesktop />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Active Sessions</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Manage your logged-in devices
                        </p>
                    </div>
                </div>

                <div className={styles.sessionsList}>
                    {/* Current Device */}
                    {currentSession && (
                        <div className={styles.sessionItem}>
                            <div className={styles.sessionIcon}>
                                {getDeviceIcon(currentSession)}
                            </div>
                            <div className={styles.sessionInfo}>
                                <p className={styles.sessionName}>
                                    This Device
                                    <span className={styles.currentBadge}>Current</span>
                                </p>
                                <p className={styles.sessionDetails}>
                                    {currentSession.provider || 'Web'} • {new Date(currentSession.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Other Sessions */}
                    {otherSessions.map((session) => (
                        <div key={session.id} className={styles.sessionItem}>
                            <div className={styles.sessionIcon}>
                                {getDeviceIcon(session)}
                            </div>
                            <div className={styles.sessionInfo}>
                                <p className={styles.sessionName}>
                                    {session.provider || 'Web'}
                                </p>
                                <p className={styles.sessionDetails}>
                                    Connected {new Date(session.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                className={styles.terminateButton}
                                onClick={() => endSession(session.id)}
                            >
                                Terminate
                            </button>
                        </div>
                    ))}

                    {sessions.length === 0 && !sessionsLoading && (
                        <p className={styles.noSessions}>No other active sessions</p>
                    )}
                </div>

                {otherSessions.length > 0 && (
                    <button 
                        className={`${sovereignStyles.biometricButton} ${styles.terminateAllButton}`}
                        onClick={() => handleSensitiveAction('logout-all')}
                    >
                        <FaSignOutAlt />
                        Sign Out All Other Devices
                    </button>
                )}
            </div>

            {/* Account Identity */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <span style={{ fontSize: '1.2rem' }}>👤</span>
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Account Identity</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Your sovereign identity on Focus
                        </p>
                    </div>
                </div>

                <div className={styles.identityCard}>
                    <UserAvatar
                        src={avatarUrl}
                        username={handle}
                        fullName={displayName}
                        size="xl"
                        eager
                    />
                    <div className={styles.identityInfo}>
                        <p className={styles.identityName}>{displayName}</p>
                        <p className={styles.identityHandle}>@{handle}</p>
                        <p className={styles.identityEmail}>{email}</p>
                        {isVerified && (
                            <span className={styles.verifiedBadge}>
                                <FaShieldAlt /> Verified Citizen
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className={`${sovereignStyles.glassTile} ${sovereignStyles.dangerZone}`}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon} style={{ color: '#F44336', background: 'rgba(244, 67, 54, 0.1)' }}>
                        <FaExclamationTriangle />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle} style={{ color: '#F44336' }}>
                            Danger Zone
                        </h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Irreversible account actions
                        </p>
                    </div>
                </div>

                <div className={styles.dangerActions}>
                    <div className={styles.dangerAction}>
                        <div className={styles.dangerActionInfo}>
                            <p className={styles.dangerActionTitle}>Delete Account</p>
                            <p className={styles.dangerActionDescription}>
                                Permanently delete your account and all associated data. This cannot be undone.
                            </p>
                        </div>
                        <button 
                            className={`${sovereignStyles.biometricButton} ${sovereignStyles.dangerButton}`}
                            onClick={() => handleSensitiveAction('delete')}
                        >
                            <FaTrash />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Biometric Challenge Modal */}
            <AnimatePresence>
                {showingBiometricChallenge && (
                    <motion.div 
                        className={styles.biometricModal}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className={styles.biometricModalContent}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className={styles.biometricIcon}>
                                <FaFingerprint />
                            </div>
                            <h3>Security Verification Required</h3>
                            <p>Authenticate to proceed with this sensitive action</p>
                            <button 
                                className={sovereignStyles.biometricButton}
                                onClick={executeBiometricChallenge}
                            >
                                <FaFingerprint />
                                Authenticate
                            </button>
                            <button 
                                className={`${sovereignStyles.biometricButton} ${sovereignStyles.secondary}`}
                                onClick={() => setShowingBiometricChallenge(false)}
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Account Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div 
                        className={styles.biometricModal}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className={styles.biometricModalContent}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className={styles.biometricIcon} style={{ color: '#F44336' }}>
                                <FaExclamationTriangle />
                            </div>
                            <h3 style={{ color: '#F44336' }}>Delete Your Account?</h3>
                            <p>
                                Are you sure you want to leave the Nation? This will:
                            </p>
                            <ul className={styles.deleteList}>
                                <li>Delete all your posts, messages, and data</li>
                                <li>Remove your profile from Focus</li>
                                <li>Scrub your Identity DNA hash</li>
                                <li>Leave 0% digital footprint</li>
                            </ul>
                            <p className={styles.deleteConfirmText}>
                                Type <strong>DELETE</strong> to confirm:
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className={styles.deleteInput}
                                placeholder="Type DELETE"
                                autoFocus
                            />
                            <button 
                                className={`${sovereignStyles.biometricButton} ${sovereignStyles.dangerButton}`}
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                            </button>
                            <button 
                                className={`${sovereignStyles.biometricButton} ${sovereignStyles.secondary}`}
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountSecuritySection;
