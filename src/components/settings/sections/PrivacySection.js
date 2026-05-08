import React from 'react';
import SettingsGlassTile, { SettingRow, Toggle, SettingSelect } from '../shared/SettingsGlassTile';

/**
 * Province 2: Privacy
 * Visibility, blocking, activity status, profile controls
 */
const PrivacySection = ({ settings, onUpdateSetting }) => {
    return (
        <>
            {/* Account Visibility */}
            <SettingsGlassTile
                icon="👁️"
                title="Account Visibility"
                description="Control who can see your profile"
            >
                <SettingRow
                    label="Account Type"
                    description="Public accounts are visible to everyone"
                >
                    <SettingSelect
                        value={settings?.account_visibility || 'public'}
                        onChange={(v) => onUpdateSetting('account_visibility', v)}
                        options={[
                            { value: 'public', label: 'Public' },
                            { value: 'private', label: 'Private' },
                            { value: 'friends', label: 'Friends Only' },
                        ]}
                    />
                </SettingRow>
                <SettingRow
                    label="Show Activity Status"
                    description="Let others see when you're online"
                >
                    <Toggle
                        checked={settings?.show_activity_status ?? true}
                        onChange={(v) => onUpdateSetting('show_activity_status', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Profile Visibility */}
            <SettingsGlassTile
                icon="🔒"
                title="Profile Visibility"
                description="Fine-tune who sees your content"
            >
                <SettingRow label="Who can view your profile">
                    <SettingSelect
                        value={settings?.who_can_view_profile || 'everyone'}
                        onChange={(v) => onUpdateSetting('who_can_view_profile', v)}
                        options={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'followers', label: 'Followers' },
                            { value: 'nobody', label: 'Nobody' },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Who can view your posts">
                    <SettingSelect
                        value={settings?.who_can_view_posts || 'everyone'}
                        onChange={(v) => onUpdateSetting('who_can_view_posts', v)}
                        options={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'followers', label: 'Followers' },
                            { value: 'nobody', label: 'Nobody' },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Who can view your stories">
                    <SettingSelect
                        value={settings?.who_can_view_stories || 'everyone'}
                        onChange={(v) => onUpdateSetting('who_can_view_stories', v)}
                        options={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'followers', label: 'Followers' },
                            { value: 'close_friends', label: 'Close Friends' },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Who can view your Boltz" noBorder>
                    <SettingSelect
                        value={settings?.who_can_view_boltz || 'everyone'}
                        onChange={(v) => onUpdateSetting('who_can_view_boltz', v)}
                        options={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'followers', label: 'Followers' },
                            { value: 'nobody', label: 'Nobody' },
                        ]}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Interactions */}
            <SettingsGlassTile
                icon="💬"
                title="Interaction Controls"
                description="Manage who can interact with you"
            >
                <SettingRow label="Who can message you">
                    <SettingSelect
                        value={settings?.who_can_message || 'followers'}
                        onChange={(v) => onUpdateSetting('who_can_message', v)}
                        options={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'followers', label: 'Followers' },
                            { value: 'nobody', label: 'Nobody' },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Who can comment on your posts">
                    <SettingSelect
                        value={settings?.who_can_comment || 'everyone'}
                        onChange={(v) => onUpdateSetting('who_can_comment', v)}
                        options={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'followers', label: 'Followers' },
                            { value: 'nobody', label: 'Nobody' },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Who can mention you" noBorder>
                    <SettingSelect
                        value={settings?.who_can_mention || 'everyone'}
                        onChange={(v) => onUpdateSetting('who_can_mention', v)}
                        options={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'followers', label: 'Followers' },
                            { value: 'nobody', label: 'Nobody' },
                        ]}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Blocked Users */}
            <SettingsGlassTile
                icon="🚫"
                title="Blocked Users"
                description="Manage users you've blocked"
            >
                <SettingRow
                    label="Blocked Accounts"
                    description="View and manage your blocked list"
                    noBorder
                >
                    <button
                        onClick={() => window.location.href = '/settings/blocked'}
                        style={{
                            background: 'rgba(var(--primary-rgb), 0.06)',
                            border: '1px solid rgba(var(--primary-rgb), 0.1)',
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 16px',
                            color: 'var(--primary-light)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-primary)',
                        }}
                    >
                        View List →
                    </button>
                </SettingRow>
            </SettingsGlassTile>
        </>
    );
};

export default PrivacySection;
