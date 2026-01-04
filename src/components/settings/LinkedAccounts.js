import React, { useState } from 'react';
import Button from '../ui/Button';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { supabase } from '../../lib/supabase';
import { useLinkedAccounts } from '../../hooks/useLinkedAccounts';
import { focusToast } from '../../utils/focusToast';
import styles from './LinkedAccounts.module.css';

const PROVIDERS = [
    { id: 'google', name: 'Google', icon: '🔍', color: '#4285F4' },
    { id: 'github', name: 'GitHub', icon: '🐙', color: '#333' },
    { id: 'discord', name: 'Discord', icon: '💬', color: '#5865F2' }
];

const LinkedAccounts = () => {
    const { linkedAccounts, loading, unlinkAccount } = useLinkedAccounts();
    const [connecting, setConnecting] = useState(null);

    const handleConnect = async (providerId) => {
        setConnecting(providerId);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: providerId,
                options: {
                    redirectTo: `${window.location.origin}/settings`,
                    scopes: 'email profile'
                }
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error connecting account:', error);
            focusToast.error(`Failed to connect ${providerId}`);
            setConnecting(null);
        }
    };

    const handleDisconnect = async (providerId) => {
        try {
            const result = await unlinkAccount(providerId);
            if (result.success) {
                focusToast.success(`${providerId} disconnected successfully`);
            } else {
                focusToast.error(`Failed to disconnect ${providerId}`);
            }
        } catch (error) {
            console.error('Error disconnecting account:', error);
            focusToast.error(`Failed to disconnect ${providerId}`);
        }
    };

    const isLinked = (providerId) => {
        return linkedAccounts.some(acc => acc.provider === providerId);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <h3 className={styles.title}>Linked Accounts</h3>
                <LoadingSkeleton count={3} height={60} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Linked Accounts</h3>
            <p className={styles.description}>
                Connect your social accounts for easier sign-in and sharing
            </p>
            <div className={styles.providers}>
                {PROVIDERS.map((provider) => {
                    const linked = isLinked(provider.id);
                    return (
                        <div key={provider.id} className={styles.provider}>
                            <div className={styles.providerInfo}>
                                <span className={styles.providerIcon}>{provider.icon}</span>
                                <div className={styles.providerDetails}>
                                    <span className={styles.providerName}>{provider.name}</span>
                                    <span className={styles.providerStatus}>
                                        {linked ? 'Connected' : 'Not connected'}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant={linked ? 'outline' : 'secondary'}
                                size="sm"
                                onClick={() => linked ? handleDisconnect(provider.id) : handleConnect(provider.id)}
                                loading={connecting === provider.id}
                                className={linked ? styles.disconnectButton : ''}
                            >
                                {linked ? 'Disconnect' : 'Connect'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LinkedAccounts;
