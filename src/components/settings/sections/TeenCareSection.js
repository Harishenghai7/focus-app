import React from 'react';
import SettingsGlassTile, { SettingRow, Toggle, SettingSelect, ActionButton } from '../shared/SettingsGlassTile';

/**
 * Province 5: Teen Care
 * Parental controls, screen time, content safety, guardian link
 */
const TeenCareSection = ({ settings, onUpdateSetting }) => {
    return (
        <>
            {/* Teen Care Overview */}
            <SettingsGlassTile
                icon="🫶"
                title="Teen Safety Mode"
                description="Enhanced protection for younger users"
            >
                <div style={{ padding: '0 0 16px' }}>
                    <ActionButton variant="primary" onClick={() => window.location.href = '/teen-care'}>
                        Open Guardian Command Center
                    </ActionButton>
                </div>
                <SettingRow
                    label="Enable Teen Care Mode"
                    description="Activates all safety features including content filtering and screen time limits"
                >
                    <Toggle
                        checked={settings?.teen_care_enabled ?? false}
                        onChange={(v) => onUpdateSetting('teen_care_enabled', v)}
                    />
                </SettingRow>
                <SettingRow
                    label="Restrict DMs from Strangers"
                    description="Only allow messages from followers you follow back"
                >
                    <Toggle
                        checked={settings?.restrict_stranger_dms ?? true}
                        onChange={(v) => onUpdateSetting('restrict_stranger_dms', v)}
                    />
                </SettingRow>
                <SettingRow
                    label="Hide Sensitive Content"
                    description="Automatically blur potentially sensitive media"
                    noBorder
                >
                    <Toggle
                        checked={settings?.hide_sensitive_content ?? true}
                        onChange={(v) => onUpdateSetting('hide_sensitive_content', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Screen Time */}
            <SettingsGlassTile
                icon="⏰"
                title="Screen Time"
                description="Manage daily usage limits"
            >
                <SettingRow
                    label="Enable Screen Time Limits"
                    description="Set a daily time limit for Focus usage"
                >
                    <Toggle
                        checked={settings?.screen_time_enabled ?? false}
                        onChange={(v) => onUpdateSetting('screen_time_enabled', v)}
                    />
                </SettingRow>
                {settings?.screen_time_enabled && (
                    <SettingRow
                        label="Daily Limit"
                        description="Maximum time allowed per day"
                    >
                        <SettingSelect
                            value={settings?.screen_time_limit || '120'}
                            onChange={(v) => onUpdateSetting('screen_time_limit', v)}
                            options={[
                                { value: '30', label: '30 minutes' },
                                { value: '60', label: '1 hour' },
                                { value: '90', label: '1.5 hours' },
                                { value: '120', label: '2 hours' },
                                { value: '180', label: '3 hours' },
                                { value: '240', label: '4 hours' },
                            ]}
                        />
                    </SettingRow>
                )}
                <SettingRow
                    label="Break Reminders"
                    description="Remind to take breaks after extended usage"
                    noBorder
                >
                    <Toggle
                        checked={settings?.break_reminders ?? true}
                        onChange={(v) => onUpdateSetting('break_reminders', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>

            {/* Guardian Link */}
            <SettingsGlassTile
                icon="👨‍👩‍👧"
                title="Guardian Link"
                description="Connect a parent or guardian account"
            >
                <SettingRow
                    label="Link Guardian Account"
                    description="Allow a trusted adult to monitor safety settings"
                    noBorder
                >
                    <ActionButton variant="secondary" onClick={() => {}}>
                        Invite Guardian
                    </ActionButton>
                </SettingRow>
            </SettingsGlassTile>

            {/* Bedtime Mode */}
            <SettingsGlassTile
                icon="😴"
                title="Bedtime Mode"
                description="Wind-down features for better sleep"
            >
                <SettingRow
                    label="Enable Bedtime Mode"
                    description="Reduces notifications and dims the interface at night"
                >
                    <Toggle
                        checked={settings?.bedtime_mode ?? false}
                        onChange={(v) => onUpdateSetting('bedtime_mode', v)}
                    />
                </SettingRow>
                <SettingRow
                    label="Night Shift"
                    description="Reduce blue light during bedtime hours"
                    noBorder
                >
                    <Toggle
                        checked={settings?.night_shift ?? false}
                        onChange={(v) => onUpdateSetting('night_shift', v)}
                    />
                </SettingRow>
            </SettingsGlassTile>
        </>
    );
};

export default TeenCareSection;
