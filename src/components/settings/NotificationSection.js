import React, { useState, useEffect } from 'react';
import SettingsSection from './SettingsSection';
import Toggle from '../shared/Toggle';
import NotificationSoundPicker from './NotificationSoundPicker';
import { triggerHaptic } from '../../utils/haptics';
import { playSave } from '../../utils/audioFX';
import styles from './NotificationSection.module.css';

const NotificationSection = ({ isExpanded, onToggle, settings, onUpdateSetting, saving = false }) => {
    const [showQuietHours, setShowQuietHours] = useState(settings?.quiet_hours_enabled ?? false);
    const [selectedSound, setSelectedSound] = useState(settings?.notification_sound || 'default');

    const applySetting = async (key, value) => {
        triggerHaptic(10);
        const result = await onUpdateSetting?.(key, value);
        if (result?.success) {
            playSave();
            return true;
        }
        return false;
    };

    // Sync local state with settings prop
    useEffect(() => {
        if (settings?.notification_sound) {
            setSelectedSound(settings.notification_sound);
        }
    }, [settings?.notification_sound]);

    const icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <SettingsSection
            id="notifications"
            title="Notifications"
            description="Manage how you receive notifications"
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <div className={styles.settingGroup}>
                <h3 className={styles.groupTitle}>Notification Channels</h3>
                <Toggle
                    label="Push Notifications"
                    description="Receive notifications on your device"
                    checked={settings?.push_notifications ?? true}
                    onChange={(value) => applySetting('push_notifications', value)}
                    disabled={saving}
                />
                <Toggle
                    label="Email Notifications"
                    description="Receive notifications via email"
                    checked={settings?.email_notifications ?? true}
                    onChange={(value) => applySetting('email_notifications', value)}
                    disabled={saving}
                />
                <Toggle
                    label="In-App Notifications"
                    description="See notifications within the app"
                    checked={settings?.in_app_notifications ?? true}
                    onChange={(value) => applySetting('in_app_notifications', value)}
                    disabled={saving}
                />
            </div>

            <div className={styles.divider} />

            <div className={styles.settingGroup}>
                <h3 className={styles.groupTitle}>Notification Types</h3>
                <p className={styles.groupDescription}>Choose which activities you want to be notified about</p>

                <Toggle
                    label="Likes"
                    description="When someone likes your content"
                    checked={settings?.notify_likes ?? true}
                    onChange={(value) => applySetting('notify_likes', value)}
                    disabled={saving}
                />
                <Toggle
                    label="Comments"
                    description="When someone comments on your content"
                    checked={settings?.notify_comments ?? true}
                    onChange={(value) => applySetting('notify_comments', value)}
                    disabled={saving}
                />
                <Toggle
                    label="New Followers"
                    description="When someone follows you"
                    checked={settings?.notify_followers ?? true}
                    onChange={(value) => applySetting('notify_followers', value)}
                    disabled={saving}
                />
                <Toggle
                    label="Mentions"
                    description="When someone mentions you"
                    checked={settings?.notify_mentions ?? true}
                    onChange={(value) => applySetting('notify_mentions', value)}
                    disabled={saving}
                />
                <Toggle
                    label="Messages"
                    description="When you receive a new message"
                    checked={settings?.notify_messages ?? true}
                    onChange={(value) => applySetting('notify_messages', value)}
                    disabled={saving}
                />
                <Toggle
                    label="Boltz"
                    description="Activity on your Boltz videos"
                    checked={settings?.notify_boltz ?? true}
                    onChange={(value) => applySetting('notify_boltz', value)}
                    disabled={saving}
                />
                <Toggle
                    label="Flash"
                    description="New Flash stories from people you follow"
                    checked={settings?.notify_flash ?? true}
                    onChange={(value) => applySetting('notify_flash', value)}
                    disabled={saving}
                />
            </div>

            <div className={styles.divider} />

            <NotificationSoundPicker
                value={selectedSound}
                onChange={async (value) => {
                    const prev = selectedSound;
                    setSelectedSound(value);
                    const ok = await applySetting('notification_sound', value);
                    if (!ok) setSelectedSound(prev);
                }}
            />

            <div className={styles.divider} />

            <div className={styles.settingGroup}>
                <Toggle
                    label="Quiet Hours (Do Not Disturb)"
                    description="Mute notifications during specific hours"
                    checked={settings?.quiet_hours_enabled ?? false}
                    onChange={async (value) => {
                        const prev = showQuietHours;
                        setShowQuietHours(value);
                        const ok = await applySetting('quiet_hours_enabled', value);
                        if (!ok) setShowQuietHours(prev);
                    }}
                    disabled={saving}
                />
                {showQuietHours && (
                    <div className={styles.quietHoursConfig}>
                        <div className={styles.timeInputs}>
                            <div className={styles.timeInput}>
                                <label className={styles.timeLabel}>Start Time</label>
                                <input
                                    type="time"
                                    value={settings?.quiet_hours_start || '22:00'}
                                    onChange={(e) => applySetting('quiet_hours_start', e.target.value)}
                                    className={styles.timeField}
                                />
                            </div>
                            <div className={styles.timeInput}>
                                <label className={styles.timeLabel}>End Time</label>
                                <input
                                    type="time"
                                    value={settings?.quiet_hours_end || '08:00'}
                                    onChange={(e) => applySetting('quiet_hours_end', e.target.value)}
                                    className={styles.timeField}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SettingsSection>
    );
};

export default NotificationSection;
