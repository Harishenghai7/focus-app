import React, { useState } from 'react';
import Button from '../ui/Button';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useSessions } from '../../hooks/useSessions';
import { useAuth } from '../../hooks/useAuth';
import { focusToast } from '../../utils/focusToast';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import styles from './SessionManager.module.css';

const SessionManager = () => {
    const { signOut } = useAuth();
    const { sessions, loading, endSession, endAllOtherSessions } = useSessions();
    const [revoking, setRevoking] = useState(null);

    const handleRevokeSession = async (sessionId) => {
        setRevoking(sessionId);
        try {
            const result = await endSession(sessionId);
            if (result.success) {
                focusToast.success('Session revoked successfully');
            } else {
                focusToast.error('Failed to revoke session');
            }
        } catch (error) {
            console.error('Error revoking session:', error);
            focusToast.error('Failed to revoke session');
        } finally {
            setRevoking(null);
        }
    };

    const handleSignOutEverywhere = async () => {
        try {
            const result = await endAllOtherSessions();
            if (result.success) {
                focusToast.success('Signed out from all devices');
                await signOut();
            } else {
                focusToast.error('Failed to sign out from all devices');
            }
        } catch (error) {
            console.error('Error signing out everywhere:', error);
            focusToast.error('Failed to sign out from all devices');
        }
    };

    const getDeviceIcon = (deviceType) => {
        if (!deviceType) return '💻';
        const type = deviceType.toLowerCase();
        if (type.includes('mobile') || type.includes('android') || type.includes('iphone')) return '📱';
        if (type.includes('tablet') || type.includes('ipad')) return '📱';
        return '💻';
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <h3 className={styles.title}>Active Sessions</h3>
                <LoadingSkeleton count={2} height={80} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>Active Sessions</h3>
                    <p className={styles.description}>
                        Manage devices where you're currently signed in
                    </p>
                </div>
                {sessions.length > 1 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOutEverywhere}
                        className={styles.signOutAllButton}
                    >
                        Sign Out Everywhere
                    </Button>
                )}
            </div>

            {sessions.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🔒</span>
                    <p className={styles.emptyText}>No active sessions</p>
                </div>
            ) : (
                <div className={styles.sessionList}>
                    {sessions.map((session) => (
                        <div key={session.id} className={styles.sessionItem}>
                            <div className={styles.sessionInfo}>
                                <span className={styles.deviceIcon}>
                                    {getDeviceIcon(session.device_info)}
                                </span>
                                <div className={styles.sessionDetails}>
                                    <span className={styles.deviceName}>
                                        {session.device_info?.userAgent || 'Unknown Device'}
                                    </span>
                                    <div className={styles.sessionMeta}>
                                        {session.ip_address && (
                                            <span className={styles.metaItem}>
                                                📍 {session.ip_address}
                                            </span>
                                        )}
                                        <span className={styles.metaItem}>
                                            🕐 {formatTimeAgo(session.last_active)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeSession(session.id)}
                                loading={revoking === session.id}
                                className={styles.revokeButton}
                            >
                                Revoke
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionManager;
