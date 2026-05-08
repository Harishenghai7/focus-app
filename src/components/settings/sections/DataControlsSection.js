import React, { useState } from 'react';
import SettingsGlassTile, { SettingRow, Toggle, ActionButton } from '../shared/SettingsGlassTile';

/**
 * Province 10: Data Controls
 * Data export, account deletion, GDPR, download data
 */
const DataControlsSection = ({ settings, onUpdateSetting }) => {
    const [exporting, setExporting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [showDelete, setShowDelete] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        setTimeout(() => {
            setExporting(false);
            alert('Your data export has been initiated. You will receive an email when it is ready.');
        }, 2000);
    };

    return (
        <>
            <SettingsGlassTile icon="📥" title="Download Your Data" description="Export a copy of all your Focus data">
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
                    Request a full copy of your data including posts, messages, profile info, and activity logs. 
                    Your download will be prepared and sent to your email.
                </p>
                <ActionButton variant="primary" icon="📥" onClick={handleExport} loading={exporting}>
                    {exporting ? 'Preparing…' : 'Request Data Export'}
                </ActionButton>
            </SettingsGlassTile>

            <SettingsGlassTile icon="🗑️" title="Clear Activity Data" description="Selectively remove stored activity">
                <SettingRow label="Clear Search History" description="Remove all saved searches" noBorder>
                    <ActionButton variant="secondary" onClick={() => {}}>Clear</ActionButton>
                </SettingRow>
                <SettingRow label="Clear Watch History" description="Remove Boltz and Flash viewing history" noBorder>
                    <ActionButton variant="secondary" onClick={() => {}}>Clear</ActionButton>
                </SettingRow>
                <SettingRow label="Clear Cache" description="Free up storage space" noBorder>
                    <ActionButton variant="secondary" onClick={() => {}}>Clear</ActionButton>
                </SettingRow>
            </SettingsGlassTile>

            <SettingsGlassTile icon="📊" title="Data Usage & Analytics" description="Control how your data is used">
                <SettingRow label="Analytics Data" description="Share anonymous usage data to improve Focus">
                    <Toggle checked={settings?.analytics_enabled ?? true} onChange={(v) => onUpdateSetting('analytics_enabled', v)} />
                </SettingRow>
                <SettingRow label="Personalized Ads" description="Allow data-driven ad personalization">
                    <Toggle checked={settings?.personalized_ads ?? false} onChange={(v) => onUpdateSetting('personalized_ads', v)} />
                </SettingRow>
                <SettingRow label="Crash Reports" description="Send crash reports to help fix issues" noBorder>
                    <Toggle checked={settings?.crash_reports ?? true} onChange={(v) => onUpdateSetting('crash_reports', v)} />
                </SettingRow>
            </SettingsGlassTile>

            {/* Danger Zone: Account Deletion */}
            <SettingsGlassTile icon="⚠️" title="Delete Account" description="Permanently remove your account" variant="danger">
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 12px' }}>
                    This will permanently delete your account, all posts, messages, and data. 
                    This action cannot be undone.
                </p>

                {!showDelete ? (
                    <ActionButton variant="danger" icon="🗑️" onClick={() => setShowDelete(true)}>
                        Delete My Account
                    </ActionButton>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--error)', margin: 0 }}>
                            Type <strong>DELETE</strong> to confirm:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="Type DELETE"
                            style={{
                                padding: '10px 14px',
                                background: 'rgba(var(--error-rgb), 0.04)',
                                border: '1px solid rgba(var(--error-rgb), 0.2)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: '0.88rem',
                                outline: 'none',
                                fontFamily: 'var(--font-primary)',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <ActionButton variant="danger" disabled={deleteConfirm !== 'DELETE'}>
                                Permanently Delete
                            </ActionButton>
                            <ActionButton variant="ghost" onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}>
                                Cancel
                            </ActionButton>
                        </div>
                    </div>
                )}
            </SettingsGlassTile>
        </>
    );
};

export default DataControlsSection;
