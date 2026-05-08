import React from 'react';
import SettingsGlassTile, { SettingRow, Toggle, SettingSelect } from '../shared/SettingsGlassTile';

/**
 * Province 8: Accessibility
 * Font size, contrast, motion, screen reader support
 */
const AccessibilitySection = ({ settings, onUpdateSetting }) => (
    <>
        <SettingsGlassTile icon="📝" title="Text & Display" description="Adjust text size and readability">
            <SettingRow label="Font Size" description="Adjust text size throughout the app">
                <SettingSelect value={settings?.font_size || 'medium'} onChange={(v) => onUpdateSetting('font_size', v)}
                    options={[
                        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' }, { value: 'x-large', label: 'Extra Large' },
                    ]} />
            </SettingRow>
            <SettingRow label="Bold Text" description="Use bolder text throughout the app">
                <Toggle checked={settings?.bold_text ?? false} onChange={(v) => onUpdateSetting('bold_text', v)} />
            </SettingRow>
            <SettingRow label="High Contrast Mode" description="Increase contrast for better readability" noBorder>
                <Toggle checked={settings?.high_contrast_mode ?? false} onChange={(v) => onUpdateSetting('high_contrast_mode', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="🎬" title="Motion & Animation" description="Control visual motion effects">
            <SettingRow label="Reduce Motion" description="Minimize animations and transitions">
                <Toggle checked={settings?.reduce_motion ?? false} onChange={(v) => onUpdateSetting('reduce_motion', v)} />
            </SettingRow>
            <SettingRow label="Reduce Transparency" description="Reduce glassmorphism and blur effects">
                <Toggle checked={settings?.reduce_transparency ?? false} onChange={(v) => onUpdateSetting('reduce_transparency', v)} />
            </SettingRow>
            <SettingRow label="Autoplay Animations" description="Automatically play GIFs and stickers" noBorder>
                <Toggle checked={settings?.autoplay_animations ?? true} onChange={(v) => onUpdateSetting('autoplay_animations', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="🔊" title="Audio & Haptics" description="Sound and vibration preferences">
            <SettingRow label="Screen Reader Support" description="Optimize layout for assistive technologies">
                <Toggle checked={settings?.screen_reader ?? false} onChange={(v) => onUpdateSetting('screen_reader', v)} />
            </SettingRow>
            <SettingRow label="Audio Descriptions" description="Enable audio descriptions for media content">
                <Toggle checked={settings?.audio_descriptions ?? false} onChange={(v) => onUpdateSetting('audio_descriptions', v)} />
            </SettingRow>
            <SettingRow label="Captions" description="Show captions on videos by default" noBorder>
                <Toggle checked={settings?.auto_captions ?? true} onChange={(v) => onUpdateSetting('auto_captions', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="🖱️" title="Navigation" description="Interaction and navigation preferences">
            <SettingRow label="Keyboard Navigation" description="Enhanced keyboard shortcuts and focus indicators">
                <Toggle checked={settings?.keyboard_nav ?? true} onChange={(v) => onUpdateSetting('keyboard_nav', v)} />
            </SettingRow>
            <SettingRow label="Touch Target Size" description="Increase touch targets for easier interaction" noBorder>
                <SettingSelect value={settings?.touch_target || 'default'} onChange={(v) => onUpdateSetting('touch_target', v)}
                    options={[
                        { value: 'default', label: 'Default' }, { value: 'large', label: 'Large' },
                        { value: 'extra-large', label: 'Extra Large' },
                    ]} />
            </SettingRow>
        </SettingsGlassTile>
    </>
);

export default AccessibilitySection;
