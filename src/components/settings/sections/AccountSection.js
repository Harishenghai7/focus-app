import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import useOAuth from '../../../hooks/useOAuth';
import { useFocusIdentity } from '../../../context/FocusIdentityContext';
import SettingsGlassTile, { SettingRow, ActionButton } from '../shared/SettingsGlassTile';
import { FaDiscord, FaGithub, FaGoogle, FaMicrosoft, FaTwitter } from 'react-icons/fa';

/**
 * Province 1: Account
 * Profile identity, email, username, linked accounts
 */
const AccountSection = ({ settings, onUpdateSetting }) => {
    const { user, signOut } = useAuth();
    const { handleOAuthLogin } = useOAuth();
    const [connectingProvider, setConnectingProvider] = useState(null);
    const identity = useFocusIdentity?.() || {};
    const { displayName, handle, email, avatarUrl } = identity;

    const connectedProviders = user?.app_metadata?.providers || [];

    const handleConnect = async (provider) => {
        setConnectingProvider(provider);
        await handleOAuthLogin(provider);
        setConnectingProvider(null);
    };

    return (
        <>
            {/* Profile Identity */}
            <SettingsGlassTile
                icon="👤"
                title="Profile Identity"
                description="Your sovereign identity on Focus"
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '4px 0 16px',
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: avatarUrl
                            ? `url(${avatarUrl}) center/cover`
                            : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                        flexShrink: 0,
                        border: '2px solid rgba(var(--primary-rgb), 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        color: 'white',
                    }}>
                        {!avatarUrl && '👤'}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 650, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {displayName || 'Focus User'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            @{handle || 'username'} · {email || 'email@focus.app'}
                        </p>
                    </div>
                </div>
                <ActionButton variant="secondary" onClick={() => window.location.href = '/profile/edit'}>
                    Edit Profile
                </ActionButton>
            </SettingsGlassTile>

            {/* Account Details */}
            <SettingsGlassTile
                icon="📧"
                title="Account Details"
                description="Email, username, and account info"
            >
                <SettingRow label="Email Address" description={email || 'Not set'}>
                    <ActionButton variant="ghost" onClick={() => {}}>Change</ActionButton>
                </SettingRow>
                <SettingRow label="Username" description={handle ? `@${handle}` : 'Not set'}>
                    <ActionButton variant="ghost" onClick={() => {}}>Change</ActionButton>
                </SettingRow>
                <SettingRow label="Phone Number" description="For recovery & verification">
                    <ActionButton variant="ghost" onClick={() => {}}>Add</ActionButton>
                </SettingRow>
            </SettingsGlassTile>

            {/* Linked Accounts */}
            <SettingsGlassTile
                icon="🔗"
                title="Linked Accounts"
                description="Connect external accounts"
            >
                {[
                    { id: 'google', label: 'Google', icon: <FaGoogle color="#4285F4" /> },
                    { id: 'azure', label: 'Microsoft', icon: <FaMicrosoft color="#00A4EF" /> },
                    { id: 'github', label: 'GitHub', icon: <FaGithub color="#f0f6fc" /> },
                    { id: 'discord', label: 'Discord', icon: <FaDiscord color="#5865F2" /> },
                    { id: 'twitter', label: 'X / Twitter', icon: <FaTwitter color="#1DA1F2" />, noBorder: true }
                ].map((provider) => {
                    const isConnected = connectedProviders.includes(provider.id);
                    const isConnecting = connectingProvider === provider.id;

                    return (
                        <SettingRow
                            key={provider.id}
                            label={provider.label}
                            icon={provider.icon}
                            description={`Sign in with ${provider.label}`}
                            noBorder={provider.noBorder}
                        >
                            <ActionButton 
                                variant={isConnected ? "ghost" : "secondary"} 
                                onClick={() => !isConnected && handleConnect(provider.id)}
                                disabled={isConnected || isConnecting}
                                loading={isConnecting}
                            >
                                {isConnected ? 'Connected ✅' : 'Connect'}
                            </ActionButton>
                        </SettingRow>
                    );
                })}
            </SettingsGlassTile>

            {/* Sign Out */}
            <SettingsGlassTile
                icon="🚪"
                title="Session"
                description="Sign out of your account"
            >
                <ActionButton
                    variant="danger"
                    icon="🚪"
                    onClick={() => {
                        signOut?.();
                        window.location.href = '/auth';
                    }}
                >
                    Sign Out
                </ActionButton>
            </SettingsGlassTile>
        </>
    );
};

export default AccountSection;
