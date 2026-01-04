import React, { useState, useEffect } from 'react';
import SettingsSection from './SettingsSection';
import Toggle from '../shared/Toggle';
import Select from '../shared/Select';
import NotificationSoundPicker from './NotificationSoundPicker';
import { useUpdateSetting } from '../../hooks/useUpdateSetting';
import styles from './NotificationSection.module.css';

const NotificationSection = ({ isExpanded, onToggle, settings }) => {
    const { updateSetting } = useUpdateSetting();
    const [showQuietHours, setShowQuietHours] = useState(settings?.quiet_hours_enabled ?? false);
    const [selectedSound, setSelectedSound] = useState(settings?.notification_sound || 'default');

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
                    onChange={(value) => updateSetting('push_notifications', value)}
                />
                <Toggle
                    label="Email Notifications"
                    description="Receive notifications via email"
                    checked={settings?.email_notifications ?? true}
                    onChange={(value) => updateSetting('email_notifications', value)}
                />
                <Toggle
                    label="In-App Notifications"
                    description="See notifications within the app"
                    checked={settings?.in_app_notifications ?? true}
                    onChange={(value) => updateSetting('in_app_notifications', value)}
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
                    onChange={(value) => updateSetting('notify_likes', value)}
                />
                <Toggle
                    label="Comments"
                    description="When someone comments on your content"
                    checked={settings?.notify_comments ?? true}
                    onChange={(value) => updateSetting('notify_comments', value)}
                />
                <Toggle
                    label="New Followers"
                    description="When someone follows you"
                    checked={settings?.notify_followers ?? true}
                    onChange={(value) => updateSetting('notify_followers', value)}
                />
                <Toggle
                    label="Mentions"
                    description="When someone mentions you"
                    checked={settings?.notify_mentions ?? true}
                    onChange={(value) => updateSetting('notify_mentions', value)}
                />
                <Toggle
                    label="Messages"
                    description="When you receive a new message"
                    checked={settings?.notify_messages ?? true}
                    onChange={(value) => updateSetting('notify_messages', value)}
                />
                <Toggle
                    label="Boltz"
                    description="Activity on your Boltz videos"
                    checked={settings?.notify_boltz ?? true}
                    onChange={(value) => updateSetting('notify_boltz', value)}
                />
                <Toggle
                    label="Flash"
                    description="New Flash stories from people you follow"
                    checked={settings?.notify_flash ?? true}
                    onChange={(value) => updateSetting('notify_flash', value)}
                />
            </div>

            <div className={styles.divider} />

            <NotificationSoundPicker
                value={selectedSound}
                onChange={(value) => {
                    setSelectedSound(value); // Optimistic update
                    updateSetting('notification_sound', value);
                }}
            />

            <div className={styles.divider} />

            <div className={styles.settingGroup}>
                <Toggle
                    label="Quiet Hours (Do Not Disturb)"
                    description="Mute notifications during specific hours"
                    checked={settings?.quiet_hours_enabled ?? false}
                    onChange={(value) => {
                        updateSetting('quiet_hours_enabled', value);
                        setShowQuietHours(value);
                    }}
                />
                {showQuietHours && (
                    <div className={styles.quietHoursConfig}>
                        <div className={styles.timeInputs}>
                            <div className={styles.timeInput}>
                                <label className={styles.timeLabel}>Start Time</label>
                                <input
                                    type="time"
                                    value={settings?.quiet_hours_start || '22:00'}
                                    onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                                    className={styles.timeField}
                                />
                            </div>
                            <div className={styles.timeInput}>
                                <label className={styles.timeLabel}>End Time</label>
                                <input
                                    type="time"
                                    value={settings?.quiet_hours_end || '08:00'}
                                    onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
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
