import React from 'react';
import SettingsGlassTile, { SettingRow, Toggle, SettingSelect } from '../shared/SettingsGlassTile';

/**
 * Province 4: Notifications
 * Push, email, in-app, quiet hours, notification types
 */
const NotificationsSection = ({ settings, onUpdateSetting }) => {
    return (
        <>
            {/* Notification Channels */}
            <SettingsGlassTile
                icon="📡"
                title="Notification Channels"
                description="Choose how you receive notifications"
            >
                <SettingRow
                    label="Push Notifications"
                    icon="📲"
                    description="Receive notifications on your device"
                >
                    <Toggle
                        checked={settings?.push_notifications ?? true}
                        onChange={(v) => onUpdateSetting('push_notifications', v)}
                    />
                </SettingRow>
                <SettingRow
                    label="Email Notifications"
                    icon="📧"
                    description="Receive notifications via email"
                >
                    <Toggle
                        checked={settings?.email_notifications ?? true}
                        onChange={(v) => onUpdateSetting('email_notifications', v)}
                    />
                </SettingRow>
                <SettingRow
                    label="In-App Notifications"
                    icon="🔔"
                    description="See notifications within Focus"
                    noBorder
                >
                    <Toggle
                        checked={settings?.in_app_notifications ?? true}
                        onChange={(v) => onUpdateSetting('in_app_notifications', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Activity Notifications */}
            <SettingsGlassTile
                icon="❤️"
                title="Activity Notifications"
                description="Choose which activities trigger notifications"
            >
                <SettingRow label="Likes" icon="❤️" description="When someone likes your content">
                    <Toggle checked={settings?.notify_likes ?? true} onChange={(v) => onUpdateSetting('notify_likes', v)} />
                </SettingRow>
                <SettingRow label="Comments" icon="💬" description="When someone comments">
                    <Toggle checked={settings?.notify_comments ?? true} onChange={(v) => onUpdateSetting('notify_comments', v)} />
                </SettingRow>
                <SettingRow label="New Followers" icon="➕" description="When someone follows you">
                    <Toggle checked={settings?.notify_followers ?? true} onChange={(v) => onUpdateSetting('notify_followers', v)} />
                </SettingRow>
                <SettingRow label="Mentions" icon="@" description="When someone mentions you">
                    <Toggle checked={settings?.notify_mentions ?? true} onChange={(v) => onUpdateSetting('notify_mentions', v)} />
                </SettingRow>
                <SettingRow label="Messages" icon="✉️" description="When you receive a message">
                    <Toggle checked={settings?.notify_messages ?? true} onChange={(v) => onUpdateSetting('notify_messages', v)} />
                </SettingRow>
                <SettingRow label="Boltz" icon="⚡" description="Activity on your Boltz videos">
                    <Toggle checked={settings?.notify_boltz ?? true} onChange={(v) => onUpdateSetting('notify_boltz', v)} />
                </SettingRow>
                <SettingRow label="Flash" icon="📸" description="New Flash stories" noBorder>
                    <Toggle checked={settings?.notify_flash ?? true} onChange={(v) => onUpdateSetting('notify_flash', v)} />
                </SettingRow>
            </SettingsGlassTile>

            {/* Sound & Haptics */}
            <SettingsGlassTile
                icon="🔊"
                title="Sound & Haptics"
                description="Customize notification feedback"
            >
                <SettingRow label="Notification Sound" description="Choose your alert tone">
                    <SettingSelect
                        value={settings?.notification_sound || 'default'}
                        onChange={(v) => onUpdateSetting('notification_sound', v)}
                        options={[
                            { value: 'default', label: 'Default' },
                            { value: 'chime', label: 'Chime' },
                            { value: 'pulse', label: 'Pulse' },
                            { value: 'aurora', label: 'Aurora' },
                            { value: 'none', label: 'Silent' },
                        ]}
                    />
                </SettingRow>
                <SettingRow
                    label="Haptic Feedback"
                    description="Vibration on interactions"
                    noBorder
                >
                    <Toggle
                        checked={settings?.haptic_feedback ?? true}
                        onChange={(v) => onUpdateSetting('haptic_feedback', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Quiet Hours */}
            <SettingsGlassTile
                icon="🌙"
                title="Quiet Hours"
                description="Mute notifications during specific times"
            >
                <SettingRow
                    label="Enable Quiet Hours"
                    description="Do Not Disturb during set hours"
                >
                    <Toggle
                        checked={settings?.quiet_hours_enabled ?? false}
                        onChange={(v) => onUpdateSetting('quiet_hours_enabled', v)}
                    />
                </SettingRow>
                {settings?.quiet_hours_enabled && (
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        paddingTop: '8px',
                    }}>
                        <div style={{ flex: 1 }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '6px',
                                fontWeight: 600,
                            }}>
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={settings?.quiet_hours_start || '22:00'}
                                onChange={(e) => onUpdateSetting('quiet_hours_start', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: 'rgba(var(--primary-rgb), 0.06)',
                                    border: '1px solid rgba(var(--primary-rgb), 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    fontFamily: 'var(--font-primary)',
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '6px',
                                fontWeight: 600,
                            }}>
                                End Time
                            </label>
                            <input
                                type="time"
                                value={settings?.quiet_hours_end || '08:00'}
                                onChange={(e) => onUpdateSetting('quiet_hours_end', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: 'rgba(var(--primary-rgb), 0.06)',
                                    border: '1px solid rgba(var(--primary-rgb), 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    fontFamily: 'var(--font-primary)',
                                }}
                            />
                        </div>
                    </div>
                )}
            </SettingsGlassTile>
        </>
    );
};

export default NotificationsSection;
