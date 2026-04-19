import React, { useEffect } from 'react';
import SettingsSection from './SettingsSection';
import Toggle from '../shared/Toggle';
import Select from '../shared/Select';
import { triggerHaptic } from '../../utils/haptics';
import { playSave } from '../../utils/audioFX';
import styles from './AppearanceSection.module.css';

const AppearanceSection = ({ isExpanded, onToggle, settings, onUpdateSetting, saving = false }) => {
    const applySetting = async (key, value) => {
        triggerHaptic(10);
        const result = await onUpdateSetting?.(key, value);
        if (result?.success) playSave();
    };

    // Apply theme to document root immediately
    useEffect(() => {
        if (settings?.theme) {
            const theme = settings.theme;

            // Remove all theme classes
            document.documentElement.classList.remove('light-theme', 'dark-theme');

            if (theme === 'auto') {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.add(prefersDark ? 'dark-theme' : 'light-theme');

                // Listen for system theme changes
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const handleChange = (e) => {
                    document.documentElement.classList.remove('light-theme', 'dark-theme');
                    document.documentElement.classList.add(e.matches ? 'dark-theme' : 'light-theme');
                };
                mediaQuery.addEventListener('change', handleChange);
                return () => mediaQuery.removeEventListener('change', handleChange);
            } else {
                // Apply selected theme
                document.documentElement.classList.add(`${theme}-theme`);
            }

            // Store in localStorage as backup
            localStorage.setItem('focus-theme', theme);
            console.log(`✅ Theme applied: ${theme}`);
        }
    }, [settings?.theme]);

    // Apply font size to document root immediately
    useEffect(() => {
        if (settings?.font_size) {
            const fontSize = settings.font_size;

            // Remove all font size classes
            document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');

            // Apply selected font size
            document.documentElement.classList.add(`font-${fontSize}`);

            // Store in localStorage as backup
            localStorage.setItem('focus-font-size', fontSize);
            console.log(`✅ Font size applied: ${fontSize}`);
        }
    }, [settings?.font_size]);

    // Apply glassmorphism setting
    useEffect(() => {
        if (settings?.glassmorphism_enabled !== undefined) {
            if (settings.glassmorphism_enabled) {
                document.documentElement.classList.add('glassmorphism-enabled');
            } else {
                document.documentElement.classList.remove('glassmorphism-enabled');
            }
            console.log(`✅ Glassmorphism: ${settings.glassmorphism_enabled ? 'enabled' : 'disabled'}`);
        }
    }, [settings?.glassmorphism_enabled]);

    // Apply high contrast mode
    useEffect(() => {
        if (settings?.high_contrast_mode !== undefined) {
            if (settings.high_contrast_mode) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
            console.log(`✅ High contrast: ${settings.high_contrast_mode ? 'enabled' : 'disabled'}`);
        }
    }, [settings?.high_contrast_mode]);

    const themeOptions = [
        { value: 'light', label: 'Light', icon: '☀️', description: 'Light theme for daytime' },
        { value: 'dark', label: 'Dark', icon: '🌙', description: 'Dark theme for nighttime' },
        { value: 'auto', label: 'Auto', icon: '🔄', description: 'Match system preference' }
    ];

    const fontSizeOptions = [
        { value: 'small', label: 'Small', description: 'Compact text' },
        { value: 'medium', label: 'Medium', description: 'Standard text' },
        { value: 'large', label: 'Large', description: 'Larger text for readability' }
    ];

    const icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        </svg>
    );

    return (
        <SettingsSection
            id="appearance"
            title="Appearance"
            description="Customize how Focus looks for you"
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <div className={styles.settingGroup}>
                <Select
                    label="Theme"
                    description="Choose your preferred color scheme"
                    value={settings?.theme || 'dark'}
                    onChange={(value) => applySetting('theme', value)}
                    options={themeOptions}
                />
                <div className={styles.themePreview}>
                    {themeOptions.map((theme) => (
                        <div
                            key={theme.value}
                            className={`${styles.themeCard} ${settings?.theme === theme.value ? styles.active : ''}`}
                            onClick={() => applySetting('theme', theme.value)}
                        >
                            <div className={`${styles.themePreviewBox} ${styles[theme.value]}`}>
                                <div className={styles.previewContent}>
                                    <div className={styles.previewHeader}></div>
                                    <div className={styles.previewBody}>
                                        <div className={styles.previewLine}></div>
                                        <div className={styles.previewLine}></div>
                                    </div>
                                </div>
                            </div>
                            <span className={styles.themeName}>{theme.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.settingGroup}>
                <Select
                    label="Font Size"
                    description="Adjust text size for better readability"
                    value={settings?.font_size || 'medium'}
                    onChange={(value) => applySetting('font_size', value)}
                    options={fontSizeOptions}
                />
                <div className={styles.fontPreview} data-size={settings?.font_size || 'medium'}>
                    <p className={styles.previewText}>The quick brown fox jumps over the lazy dog</p>
                </div>
            </div>

            <div className={styles.divider} />

            <Toggle
                label="Glassmorphism Effects"
                description="Enable glass-like transparency effects throughout the app"
                checked={settings?.glassmorphism_enabled ?? true}
                onChange={(value) => applySetting('glassmorphism_enabled', value)}
                disabled={saving}
            />

            <Toggle
                label="High Contrast Mode"
                description="Increase contrast for better visibility"
                checked={settings?.high_contrast_mode ?? false}
                onChange={(value) => applySetting('high_contrast_mode', value)}
                disabled={saving}
            />

            <div className={styles.divider} />

            <Select
                label="Undo Timeout"
                description="How long you have to undo actions like likes and saves"
                value={settings?.undoTimeout || 3}
                onChange={(value) => {
                    applySetting('undoTimeout', parseInt(value, 10));
                    // Update localStorage for immediate effect
                    const currentSettings = JSON.parse(localStorage.getItem('focus_settings') || '{}');
                    currentSettings.undoTimeout = parseInt(value, 10);
                    localStorage.setItem('focus_settings', JSON.stringify(currentSettings));
                }}
                options={[
                    { value: 3, label: '3 seconds', description: 'Quick undo window' },
                    { value: 4, label: '4 seconds', description: 'Balanced' },
                    { value: 5, label: '5 seconds', description: 'More time to decide' }
                ]}
            />
        </SettingsSection>
    );
};

export default AppearanceSection;
