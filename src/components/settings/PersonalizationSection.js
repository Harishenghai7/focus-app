import React, { useState, useCallback, useEffect } from 'react';
import { FaPalette, FaBell, FaFont, FaAdjust, FaMobile, FaDesktop, FaMoon, FaSun } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSettingsUpdate } from '../../hooks/useSettingsUpdate';
import { useAuth } from '../../hooks/useAuth';
import { focusToast } from '../../utils/focusToast';
import { triggerHaptic } from '../../utils/haptics';
import NotificationSoundPicker from './NotificationSoundPicker';
import sovereignStyles from './SovereignSettings.module.css';
import styles from './PersonalizationSection.module.css';

/**
 * Province 3: Personalization
 * 
 * H2 Theme customization, Notification Heartbeat, Display preferences
 */
const PersonalizationSection = ({ 
    settings,
    onUpdateSetting 
}) => {
    const { user } = useAuth();
    const { isSaving } = useSettingsUpdate();
    
    const [activeTheme, setActiveTheme] = useState(settings?.theme || 'dark');
    const [fontSize, setFontSize] = useState(settings?.font_size || 'medium');
    const [glassmorphism, setGlassmorphism] = useState(settings?.glassmorphism_enabled !== false);
    const [highContrast, setHighContrast] = useState(settings?.high_contrast_mode || false);
    const [compactMode, setCompactMode] = useState(settings?.compact_mode || false);

    // Notification settings
    const [notifications, setNotifications] = useState({
        push: settings?.push_notifications !== false,
        email: settings?.email_notifications !== false,
        inApp: settings?.in_app_notifications !== false,
        likes: settings?.notify_likes !== false,
        comments: settings?.notify_comments !== false,
        followers: settings?.notify_followers !== false,
        mentions: settings?.notify_mentions !== false,
        messages: settings?.notify_messages !== false,
        quietHours: settings?.quiet_hours_enabled || false,
        quietHoursStart: settings?.quiet_hours_start || '22:00',
        quietHoursEnd: settings?.quiet_hours_end || '08:00'
    });

    // Theme options
    const themes = [
        { value: 'dark', label: 'Sovereign Dark', icon: <FaMoon />, color: '#1a1a2e' },
        { value: 'light', label: 'Royal Light', icon: <FaSun />, color: '#f8f9fa' },
        { value: 'auto', label: 'Adaptive', icon: <FaAdjust />, color: 'linear-gradient(135deg, #1a1a2e, #f8f9fa)' }
    ];

    // Font size options
    const fontSizes = [
        { value: 'small', label: 'Small', scale: '0.9' },
        { value: 'medium', label: 'Medium', scale: '1' },
        { value: 'large', label: 'Large', scale: '1.1' },
        { value: 'xl', label: 'Extra Large', scale: '1.2' }
    ];

    // Handle theme change
    const handleThemeChange = useCallback((theme) => {
        setActiveTheme(theme);
        onUpdateSetting?.('theme', theme);
        triggerHaptic('light');
        
        // Apply theme immediately
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('focus_theme', theme);
        
        focusToast.success(`Theme changed to ${themes.find(t => t.value === theme)?.label}`);
    }, [onUpdateSetting]);

    // Handle font size change
    const handleFontSizeChange = useCallback((size) => {
        setFontSize(size);
        onUpdateSetting?.('font_size', size);
        triggerHaptic('light');
        
        // Apply font size
        const scale = fontSizes.find(f => f.value === size)?.scale || '1';
        document.documentElement.style.fontSize = `${parseFloat(scale) * 16}px`;
    }, [onUpdateSetting]);

    // Handle toggle changes
    const handleToggle = useCallback((key, value) => {
        onUpdateSetting?.(key, value);
        triggerHaptic('light');
    }, [onUpdateSetting]);

    // Handle notification toggle
    const handleNotificationToggle = useCallback((key) => {
        const newValue = !notifications[key];
        setNotifications(prev => ({ ...prev, [key]: newValue }));
        onUpdateSetting?.(key === 'push' ? 'push_notifications' : 
                         key === 'email' ? 'email_notifications' :
                         key === 'inApp' ? 'in_app_notifications' :
                         `notify_${key}`, newValue);
        triggerHaptic('light');
    }, [notifications, onUpdateSetting]);

    // Handle quiet hours change
    const handleQuietHoursChange = useCallback((field, value) => {
        setNotifications(prev => ({ ...prev, [field]: value }));
        onUpdateSetting?.(field === 'start' ? 'quiet_hours_start' : 'quiet_hours_end', value);
    }, [onUpdateSetting]);

    // Apply settings on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('focus_theme') || settings?.theme || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const savedFontSize = settings?.font_size || 'medium';
        const scale = fontSizes.find(f => f.value === savedFontSize)?.scale || '1';
        document.documentElement.style.fontSize = `${parseFloat(scale) * 16}px`;
    }, [settings?.theme, settings?.font_size]);

    return (
        <div className={sovereignStyles.slideIn}>
            {/* H2 Theme Selection */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaPalette />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>H2 Theme</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Customize your visual experience
                        </p>
                    </div>
                </div>

                <div className={styles.themeGrid}>
                    {themes.map((theme) => (
                        <button
                            key={theme.value}
                            className={`${styles.themeCard} ${activeTheme === theme.value ? styles.active : ''}`}
                            onClick={() => handleThemeChange(theme.value)}
                        >
                            <div 
                                className={styles.themePreview}
                                style={{ background: theme.color }}
                            >
                                {theme.icon}
                            </div>
                            <span className={styles.themeLabel}>{theme.label}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.themeFeatures}>
                    <div className={sovereignStyles.settingRow}>
                        <div className={sovereignStyles.settingInfo}>
                            <p className={sovereignStyles.settingLabel}>
                                <FaAdjust className={sovereignStyles.satinIcon} />
                                Glassmorphism Effects
                            </p>
                            <p className={sovereignStyles.settingDescription}>
                                Enable blur and transparency effects
                            </p>
                        </div>
                        <div className={sovereignStyles.settingControl}>
                            <div 
                                className={`${sovereignStyles.toggleSwitch} ${glassmorphism ? sovereignStyles.active : ''}`}
                                onClick={() => {
                                    setGlassmorphism(!glassmorphism);
                                    handleToggle('glassmorphism_enabled', !glassmorphism);
                                }}
                            >
                                <div className={sovereignStyles.toggleKnob} />
                            </div>
                        </div>
                    </div>

                    <div className={sovereignStyles.settingRow}>
                        <div className={sovereignStyles.settingInfo}>
                            <p className={sovereignStyles.settingLabel}>
                                <FaAdjust className={sovereignStyles.satinIcon} />
                                High Contrast Mode
                            </p>
                            <p className={sovereignStyles.settingDescription}>
                                Enhanced visibility for accessibility
                            </p>
                        </div>
                        <div className={sovereignStyles.settingControl}>
                            <div 
                                className={`${sovereignStyles.toggleSwitch} ${highContrast ? sovereignStyles.active : ''}`}
                                onClick={() => {
                                    setHighContrast(!highContrast);
                                    handleToggle('high_contrast_mode', !highContrast);
                                }}
                            >
                                <div className={sovereignStyles.toggleKnob} />
                            </div>
                        </div>
                    </div>

                    <div className={sovereignStyles.settingRow}>
                        <div className={sovereignStyles.settingInfo}>
                            <p className={sovereignStyles.settingLabel}>
                                <FaMobile className={sovereignStyles.satinIcon} />
                                Compact Mode
                            </p>
                            <p className={sovereignStyles.settingDescription}>
                                Smaller UI elements for more content
                            </p>
                        </div>
                        <div className={sovereignStyles.settingControl}>
                            <div 
                                className={`${sovereignStyles.toggleSwitch} ${compactMode ? sovereignStyles.active : ''}`}
                                onClick={() => {
                                    setCompactMode(!compactMode);
                                    handleToggle('compact_mode', !compactMode);
                                }}
                            >
                                <div className={sovereignStyles.toggleKnob} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Typography */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaFont />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Typography</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Adjust text size and readability
                        </p>
                    </div>
                </div>

                <div className={styles.fontSizeGrid}>
                    {fontSizes.map((size) => (
                        <button
                            key={size.value}
                            className={`${styles.fontSizeCard} ${fontSize === size.value ? styles.active : ''}`}
                            onClick={() => handleFontSizeChange(size.value)}
                        >
                            <span 
                                className={styles.fontSizeSample}
                                style={{ fontSize: `${parseFloat(size.scale) * 1.2}rem` }}
                            >
                                Aa
                            </span>
                            <span className={styles.fontSizeLabel}>{size.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Notification Heartbeat */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaBell />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Notification Heartbeat</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Control how Focus communicates with you
                        </p>
                    </div>
                </div>

                <div className={styles.notificationGroups}>
                    {/* Delivery Methods */}
                    <div className={styles.notificationGroup}>
                        <h4 className={styles.groupTitle}>Delivery Methods</h4>
                        
                        <div className={sovereignStyles.settingRow}>
                            <div className={sovereignStyles.settingInfo}>
                                <p className={sovereignStyles.settingLabel}>Push Notifications</p>
                                <p className={sovereignStyles.settingDescription}>Receive alerts on your device</p>
                            </div>
                            <div className={sovereignStyles.settingControl}>
                                <div 
                                    className={`${sovereignStyles.toggleSwitch} ${notifications.push ? sovereignStyles.active : ''}`}
                                    onClick={() => handleNotificationToggle('push')}
                                >
                                    <div className={sovereignStyles.toggleKnob} />
                                </div>
                            </div>
                        </div>

                        <div className={sovereignStyles.settingRow}>
                            <div className={sovereignStyles.settingInfo}>
                                <p className={sovereignStyles.settingLabel}>Email Notifications</p>
                                <p className={sovereignStyles.settingDescription}>Updates sent to your inbox</p>
                            </div>
                            <div className={sovereignStyles.settingControl}>
                                <div 
                                    className={`${sovereignStyles.toggleSwitch} ${notifications.email ? sovereignStyles.active : ''}`}
                                    onClick={() => handleNotificationToggle('email')}
                                >
                                    <div className={sovereignStyles.toggleKnob} />
                                </div>
                            </div>
                        </div>

                        <div className={sovereignStyles.settingRow}>
                            <div className={sovereignStyles.settingInfo}>
                                <p className={sovereignStyles.settingLabel}>In-App Notifications</p>
                                <p className={sovereignStyles.settingDescription}>Banners within the app</p>
                            </div>
                            <div className={sovereignStyles.settingControl}>
                                <div 
                                    className={`${sovereignStyles.toggleSwitch} ${notifications.inApp ? sovereignStyles.active : ''}`}
                                    onClick={() => handleNotificationToggle('inApp')}
                                >
                                    <div className={sovereignStyles.toggleKnob} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Types */}
                    <div className={styles.notificationGroup}>
                        <h4 className={styles.groupTitle}>Notification Types</h4>
                        
                        <div className={styles.notificationGrid}>
                            {[
                                { key: 'likes', label: 'Likes', icon: '❤️' },
                                { key: 'comments', label: 'Comments', icon: '💬' },
                                { key: 'followers', label: 'Followers', icon: '👥' },
                                { key: 'mentions', label: 'Mentions', icon: '@' },
                                { key: 'messages', label: 'Messages', icon: '✉️' }
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    className={`${styles.notificationTypeCard} ${
                                        notifications[item.key] ? styles.active : ''
                                    }`}
                                    onClick={() => handleNotificationToggle(item.key)}
                                >
                                    <span className={styles.typeIcon}>{item.icon}</span>
                                    <span className={styles.typeLabel}>{item.label}</span>
                                    <div className={`${sovereignStyles.toggleSwitch} small ${
                                        notifications[item.key] ? sovereignStyles.active : ''
                                    }`}>
                                        <div className={sovereignStyles.toggleKnob} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quiet Hours */}
                    <div className={styles.notificationGroup}>
                        <div className={styles.quietHoursHeader}>
                            <h4 className={styles.groupTitle}>Quiet Hours</h4>
                            <div 
                                className={`${sovereignStyles.toggleSwitch} ${
                                    notifications.quietHours ? sovereignStyles.active : ''
                                }`}
                                onClick={() => {
                                    const newValue = !notifications.quietHours;
                                    setNotifications(prev => ({ ...prev, quietHours: newValue }));
                                    onUpdateSetting?.('quiet_hours_enabled', newValue);
                                }}
                            >
                                <div className={sovereignStyles.toggleKnob} />
                            </div>
                        </div>
                        
                        {notifications.quietHours && (
                            <motion.div 
                                className={styles.quietHoursSettings}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className={styles.timeInputGroup}>
                                    <div className={styles.timeInput}>
                                        <label>Start</label>
                                        <input
                                            type="time"
                                            value={notifications.quietHoursStart}
                                            onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.timeSeparator}>to</div>
                                    <div className={styles.timeInput}>
                                        <label>End</label>
                                        <input
                                            type="time"
                                            value={notifications.quietHoursEnd}
                                            onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Sound Picker */}
                <div className={styles.soundSection}>
                    <h4 className={styles.groupTitle}>Notification Sound</h4>
                    <NotificationSoundPicker 
                        currentSound={settings?.notification_sound || 'default'}
                        onChange={(sound) => onUpdateSetting?.('notification_sound', sound)}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalizationSection;
