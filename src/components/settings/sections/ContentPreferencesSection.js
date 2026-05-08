import React from 'react';
import SettingsGlassTile, { SettingRow, Toggle, SettingSelect } from '../shared/SettingsGlassTile';

/**
 * Province 7: Content Preferences
 * Theme controls, language settings, feed filters
 */
const ContentPreferencesSection = ({ settings, onUpdateSetting }) => (
    <>
        <SettingsGlassTile icon="🎨" title="Theme" description="Customize your visual experience">
            <SettingRow label="App Theme" description="Choose your preferred appearance">
                <SettingSelect value={settings?.theme || 'dark'} onChange={(v) => onUpdateSetting('theme', v)}
                    options={[
                        { value: 'dark', label: 'Dark (Sovereign)' },
                        { value: 'light', label: 'Light' },
                        { value: 'auto', label: 'System Default' },
                        { value: 'midnight', label: 'Midnight AMOLED' },
                    ]} />
            </SettingRow>
            <SettingRow label="Glassmorphism Effects" description="Enable frosted glass UI effects">
                <Toggle checked={settings?.glassmorphism_enabled ?? true} onChange={(v) => onUpdateSetting('glassmorphism_enabled', v)} />
            </SettingRow>
            <SettingRow label="Compact Mode" description="Reduce spacing for denser UI" noBorder>
                <Toggle checked={settings?.compact_mode ?? false} onChange={(v) => onUpdateSetting('compact_mode', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="🌐" title="Language" description="App language and regional preferences">
            <SettingRow label="Display Language" description="Choose your preferred language">
                <SettingSelect value={settings?.language || 'en'} onChange={(v) => onUpdateSetting('language', v)}
                    options={[
                        { value: 'en', label: 'English' }, { value: 'es', label: 'Español' },
                        { value: 'fr', label: 'Français' }, { value: 'de', label: 'Deutsch' },
                        { value: 'pt', label: 'Português' }, { value: 'ja', label: '日本語' },
                        { value: 'ko', label: '한국어' }, { value: 'zh', label: '中文' },
                        { value: 'ar', label: 'العربية' }, { value: 'hi', label: 'हिन्दी' },
                        { value: 'ta', label: 'தமிழ்' },
                    ]} />
            </SettingRow>
            <SettingRow label="Translate Posts" description="Auto-translate posts in other languages" noBorder>
                <Toggle checked={settings?.auto_translate ?? true} onChange={(v) => onUpdateSetting('auto_translate', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="🔍" title="Content Filter" description="Control the type of content in your feed">
            <SettingRow label="Content Filter Level" description="How strictly content is filtered">
                <SettingSelect value={settings?.content_filter_level || 'balanced'} onChange={(v) => onUpdateSetting('content_filter_level', v)}
                    options={[
                        { value: 'strict', label: 'Strict' }, { value: 'balanced', label: 'Balanced' },
                        { value: 'relaxed', label: 'Relaxed' },
                    ]} />
            </SettingRow>
            <SettingRow label="Sensitive Content Warning" description="Show warnings before sensitive content">
                <Toggle checked={settings?.sensitive_content_warning ?? true} onChange={(v) => onUpdateSetting('sensitive_content_warning', v)} />
            </SettingRow>
            <SettingRow label="Autoplay Videos" description="Automatically play videos in feed" noBorder>
                <Toggle checked={settings?.autoplay_videos ?? true} onChange={(v) => onUpdateSetting('autoplay_videos', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="📰" title="Feed Preferences" description="Customize your home feed">
            <SettingRow label="Default Feed" description="Choose your default feed view">
                <SettingSelect value={settings?.default_feed || 'for_you'} onChange={(v) => onUpdateSetting('default_feed', v)}
                    options={[
                        { value: 'for_you', label: 'For You' }, { value: 'following', label: 'Following' },
                        { value: 'trending', label: 'Trending' },
                    ]} />
            </SettingRow>
            <SettingRow label="Show Suggested Content" description="Recommended posts from people you don't follow" noBorder>
                <Toggle checked={settings?.show_suggestions ?? true} onChange={(v) => onUpdateSetting('show_suggestions', v)} />
            </SettingRow>
        </SettingsGlassTile>
    </>
);

export default ContentPreferencesSection;
