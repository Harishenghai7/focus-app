import React, { useState, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import SettingsGlassTile, { SettingRow, Toggle, ActionButton } from '../shared/SettingsGlassTile';

/**
 * Province 3: Security
 * 2FA, biometrics, password management, session management
 */
const SecuritySection = ({ settings, onUpdateSetting }) => {
    const { user } = useAuth();
    const [biometricEnabled, setBiometricEnabled] = useState(
        () => localStorage.getItem('biometric_lock_enabled') === 'true'
    );
    const [showChangePassword, setShowChangePassword] = useState(false);

    const toggleBiometric = useCallback(() => {
        const newVal = !biometricEnabled;
        setBiometricEnabled(newVal);
        localStorage.setItem('biometric_lock_enabled', String(newVal));
        onUpdateSetting?.('biometric_lock_enabled', newVal);
    }, [biometricEnabled, onUpdateSetting]);

    return (
        <>
            {/* Two-Factor Authentication */}
            <SettingsGlassTile
                icon="🔐"
                title="Two-Factor Authentication"
                description="Add an extra layer of security"
            >
                <SettingRow
                    label="Enable 2FA"
                    description="Require a verification code when signing in from a new device"
                >
                    <Toggle
                        checked={settings?.two_factor_enabled ?? false}
                        onChange={(v) => onUpdateSetting('two_factor_enabled', v)}
                    />
                </SettingRow>
                {settings?.two_factor_enabled && (
                    <SettingRow
                        label="Authentication Method"
                        description="Choose how you receive verification codes"
                        noBorder
                    >
                        <select
                            style={{
                                appearance: 'none',
                                padding: '8px 32px 8px 14px',
                                fontSize: '0.82rem',
                                fontWeight: 550,
                                color: 'var(--text-primary)',
                                background: 'rgba(var(--primary-rgb), 0.06)',
                                border: '1px solid rgba(var(--primary-rgb), 0.1)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                outline: 'none',
                                fontFamily: 'var(--font-primary)',
                            }}
                            value={settings?.two_factor_method || 'authenticator'}
                            onChange={(e) => onUpdateSetting('two_factor_method', e.target.value)}
                        >
                            <option value="authenticator">Authenticator App</option>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                        </select>
                    </SettingRow>
                )}
            </SettingsGlassTile>

            {/* Biometric Lock */}
            <SettingsGlassTile
                icon="🫳"
                title="Biometric Lock"
                description="Face ID / Fingerprint protection"
            >
                <SettingRow
                    label="Enable Biometric Lock"
                    description="Require Face ID or fingerprint to open the app"
                >
                    <Toggle checked={biometricEnabled} onChange={toggleBiometric} />
                </SettingRow>
                <SettingRow
                    label="Lock on App Switch"
                    description="Require authentication when switching back to Focus"
                    noBorder
                >
                    <Toggle
                        checked={settings?.lock_on_switch ?? false}
                        onChange={(v) => onUpdateSetting('lock_on_switch', v)}
                        disabled={!biometricEnabled}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Password */}
            <SettingsGlassTile
                icon="🔑"
                title="Password"
                description="Manage your account password"
            >
                <SettingRow
                    label="Change Password"
                    description="Update your password regularly for better security"
                    noBorder
                >
                    <ActionButton variant="secondary" onClick={() => setShowChangePassword(true)}>
                        Change
                    </ActionButton>
                </SettingRow>
            </SettingsGlassTile>

            {/* Active Sessions */}
            <SettingsGlassTile
                icon="📱"
                title="Device Management"
                description="Active sessions and logged-in devices"
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '4px 0 12px',
                    borderBottom: '1px solid rgba(var(--primary-rgb), 0.04)',
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(var(--success-rgb), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                    }}>💻</div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            This Device
                            <span style={{
                                marginLeft: '8px',
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                background: 'rgba(var(--success-rgb), 0.12)',
                                color: 'var(--success)',
                                borderRadius: '20px',
                                fontWeight: 650,
                            }}>Current</span>
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Web Browser · Active now
                        </p>
                    </div>
                </div>
                <div style={{ paddingTop: '12px' }}>
                    <ActionButton variant="danger" icon="🚪">
                        Sign Out All Other Devices
                    </ActionButton>
                </div>
            </SettingsGlassTile>

            {/* Login Alerts */}
            <SettingsGlassTile
                icon="🔔"
                title="Login Alerts"
                description="Get notified of suspicious activity"
            >
                <SettingRow
                    label="New Login Alerts"
                    description="Receive a notification when your account is accessed from a new device"
                >
                    <Toggle
                        checked={settings?.login_alerts ?? true}
                        onChange={(v) => onUpdateSetting('login_alerts', v)}
                    />
                </SettingRow>
                <SettingRow
                    label="Suspicious Activity Alerts"
                    description="Get warned about unusual account activity"
                    noBorder
                >
                    <Toggle
                        checked={settings?.suspicious_alerts ?? true}
                        onChange={(v) => onUpdateSetting('suspicious_alerts', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>
        </>
    );
};

export default SecuritySection;
