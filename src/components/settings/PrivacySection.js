import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsSection from './SettingsSection';
import Toggle from '../shared/Toggle';
import Select from '../shared/Select';
import BlockedUsers from './BlockedUsers';
import SessionManager from './SessionManager';
import { useTrustScore } from '../../hooks/useTrustScore';
import { useVerifications } from '../../hooks/useVerifications';
import { useAuth } from '../../hooks/useAuth';
import { dataExport } from '../../utils/DataExport';
import TrustScoreCard from '../trustShield/TrustScoreCard';
import VerificationCard from '../trustShield/VerificationCard';
import { focusToast } from '../../utils/focusToast';
import { triggerHaptic } from '../../utils/haptics';
import { playSave } from '../../utils/audioFX';
import styles from './PrivacySection.module.css';

const PrivacySection = ({ isExpanded, onToggle, settings, onUpdateSetting, saving = false }) => {
    const navigate = useNavigate();
    const [show2FASetup, setShow2FASetup] = useState(false);

    const { user } = useAuth();
    const { score, loading: scoreLoading } = useTrustScore(user);
    const { verifications } = useVerifications();
    const applySetting = async (key, value) => {
        triggerHaptic(10);
        const result = await onUpdateSetting?.(key, value);
        if (result?.success) playSave();
        return result?.success;
    };

    const visibilityOptions = [
        { value: 'everyone', label: 'Everyone', description: 'Anyone can see' },
        { value: 'followers', label: 'Followers Only', description: 'Only your followers' },
        { value: 'nobody', label: 'Nobody', description: 'Only you' }
    ];

    const icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <SettingsSection
            id="privacy"
            title="Privacy & Security"
            description="Control your privacy and security settings"
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <div className={styles.trustSection}>
                <h3 className={styles.groupTitle}>Trust & Security</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <TrustScoreCard score={score} loading={scoreLoading} />
                        <button
                            onClick={() => navigate('/security')}
                            style={{
                                marginTop: '12px',
                                width: '100%',
                                padding: '8px',
                                background: 'none',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                color: '#4f46e5',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            View Security Center
                        </button>
                    </div>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <VerificationCard
                            verifications={verifications}
                            onVerify={() => navigate('/verification-center')}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.divider} />

            <Toggle
                label="Public Account"
                description="Allow anyone to see your profile and posts"
                checked={settings?.account_visibility === 'public'}
                onChange={(value) => applySetting('account_visibility', value ? 'public' : 'private')}
                disabled={saving}
            />

            <div className={styles.divider} />

            <Toggle
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                checked={settings?.two_factor_enabled ?? false}
                onChange={(value) => {
                    if (value) {
                        setShow2FASetup(true);
                    } else {
                        applySetting('two_factor_enabled', false);
                    }
                }}
                disabled={saving}
            />

            {show2FASetup && (
                <div className={styles.infoBox}>
                    <p>Two-factor authentication setup will be available in a future update.</p>
                </div>
            )}

            <div className={styles.divider} />

            <div className={styles.settingGroup}>
                <h3 className={styles.groupTitle}>Content Visibility</h3>
                <p className={styles.groupDescription}>Control who can see your content</p>

                <Select
                    label="Profile"
                    value={settings?.who_can_view_profile || 'everyone'}
                    onChange={(value) => applySetting('who_can_view_profile', value)}
                    options={visibilityOptions}
                />

                <Select
                    label="Posts"
                    value={settings?.who_can_view_posts || 'everyone'}
                    onChange={(value) => applySetting('who_can_view_posts', value)}
                    options={visibilityOptions}
                />

                <Select
                    label="Stories"
                    value={settings?.who_can_view_stories || 'everyone'}
                    onChange={(value) => applySetting('who_can_view_stories', value)}
                    options={visibilityOptions}
                />

                <Select
                    label="Boltz"
                    value={settings?.who_can_view_boltz || 'everyone'}
                    onChange={(value) => applySetting('who_can_view_boltz', value)}
                    options={visibilityOptions}
                />
            </div>

            <div className={styles.divider} />

            <Toggle
                label="Activity Status"
                description="Let others see when you're online"
                checked={settings?.show_activity_status ?? true}
                onChange={(value) => applySetting('show_activity_status', value)}
                disabled={saving}
            />

            <div className={styles.divider} />

            <BlockedUsers />

            <div className={styles.divider} />

            <div className={styles.settingGroup}>
                <h3 className={styles.groupTitle}>📥 Download My Data</h3>
                <p className={styles.groupDescription}>
                    Export all your data from Focus. We believe in transparency and your right to your data.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                        onClick={async () => {
                            focusToast.info('Preparing your data export...');
                            try {
                                const data = await dataExport.exportAllData(user.id);
                                dataExport.downloadJSON(data, `focus-data-${Date.now()}.json`);
                                focusToast.success('Data exported successfully!');
                            } catch (error) {
                                console.error('Export failed:', error);
                                focusToast.error('Failed to export data');
                            }
                        }}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            background: 'var(--primary-lavender)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Download JSON
                    </button>
                    <button
                        onClick={async () => {
                            focusToast.info('Preparing your data export...');
                            try {
                                const data = await dataExport.exportAllData(user.id);
                                dataExport.downloadCSV(data, `focus-data-${Date.now()}.csv`);
                                focusToast.success('Data exported successfully!');
                            } catch (error) {
                                console.error('Export failed:', error);
                                focusToast.error('Failed to export data');
                            }
                        }}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Download CSV
                    </button>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Includes: Profile, Posts, Comments, Messages, Likes, Saves, Followers, Following, and Settings
                </p>
            </div>

            <div className={styles.divider} />

            <SessionManager />
        </SettingsSection>
    );
};

export default PrivacySection;
