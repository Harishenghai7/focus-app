import React from 'react';
import SettingsGlassTile, { SettingRow, Toggle, ActionButton } from '../shared/SettingsGlassTile';

/**
 * Province 6: Trust Shield
 * Identity verification, trust score, verification tiers
 */
const TrustShieldSection = ({ settings, onUpdateSetting }) => {
    return (
        <>
            {/* Trust Score Overview */}
            <SettingsGlassTile
                icon="⚡"
                title="Trust Score"
                description="Your digital identity credibility"
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '8px 0 16px',
                }}>
                    {/* Score Ring */}
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'conic-gradient(var(--primary) 75%, rgba(var(--primary-rgb), 0.1) 0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: 'var(--primary-light)',
                        }}>
                            75
                        </div>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Trusted
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            Your trust score reflects your verification level, community standing, and account age.
                        </p>
                    </div>
                </div>
                <ActionButton variant="primary" onClick={() => window.location.href = '/trust-shield'}>
                    Open Command Center
                </ActionButton>
            </SettingsGlassTile>

            {/* Verification Status */}
            <SettingsGlassTile
                icon="✅"
                title="Verification Status"
                description="Your identity verification tiers"
            >
                {[
                    { tier: 'Phone Verified', status: true, icon: '📱', desc: 'Phone number verified' },
                    { tier: 'Photo Verified', status: true, icon: '📷', desc: 'Selfie verification completed' },
                    { tier: 'Government ID', status: false, icon: '🪪', desc: 'Government-issued ID verification' },
                    { tier: 'Community Trust', status: false, icon: '👥', desc: 'Vouched by 3+ verified members' },
                ].map((v, i) => (
                    <SettingRow
                        key={v.tier}
                        label={v.tier}
                        icon={v.icon}
                        description={v.desc}
                        noBorder={i === 3}
                    >
                        {v.status ? (
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 650,
                                padding: '4px 12px',
                                borderRadius: '20px',
                                background: 'rgba(var(--success-rgb), 0.12)',
                                color: 'var(--success)',
                                border: '1px solid rgba(var(--success-rgb), 0.2)',
                            }}>
                                Verified
                            </span>
                        ) : (
                            <ActionButton variant="secondary" onClick={() => {}}>
                                Verify
                            </ActionButton>
                        )}
                    </SettingRow>
                ))}
            </SettingsGlassTile>

            {/* Identity Protection */}
            <SettingsGlassTile
                icon="🛡️"
                title="Identity Protection"
                description="Protect against impersonation"
            >
                <SettingRow
                    label="Impersonation Alerts"
                    description="Get notified if someone creates an account mimicking yours"
                >
                    <Toggle
                        checked={settings?.impersonation_alerts ?? true}
                        onChange={(v) => onUpdateSetting('impersonation_alerts', v)}
                    />
                </SettingRow>
                <SettingRow
                    label="Show Trust Badge"
                    description="Display your trust shield badge on your profile"
                    noBorder
                >
                    <Toggle
                        checked={settings?.show_trust_badge ?? true}
                        onChange={(v) => onUpdateSetting('show_trust_badge', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>
        </>
    );
};

export default TrustShieldSection;
