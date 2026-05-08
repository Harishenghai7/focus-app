import React from 'react';
import SettingsGlassTile, { SettingRow, Toggle, SettingSelect } from '../shared/SettingsGlassTile';

/**
 * Province 9: Focusly AI
 * Mascot behavior, voice, suggestions, AI personality
 */
const FocuslyAISettingsSection = ({ settings, onUpdateSetting }) => (
    <>
        <SettingsGlassTile icon="🤖" title="AI Assistant" description="Configure Focusly AI behavior">
            <SettingRow label="Enable Focusly AI" description="Turn on the AI-powered assistant">
                <Toggle checked={settings?.ai_enabled ?? true} onChange={(v) => onUpdateSetting('ai_enabled', v)} />
            </SettingRow>
            <SettingRow label="AI Personality" description="Choose Focusly's personality style">
                <SettingSelect value={settings?.ai_personality || 'friendly'} onChange={(v) => onUpdateSetting('ai_personality', v)}
                    options={[
                        { value: 'friendly', label: 'Friendly' }, { value: 'professional', label: 'Professional' },
                        { value: 'playful', label: 'Playful' }, { value: 'calm', label: 'Calm & Zen' },
                    ]} />
            </SettingRow>
            <SettingRow label="AI Response Style" description="How Focusly communicates with you" noBorder>
                <SettingSelect value={settings?.ai_response_style || 'balanced'} onChange={(v) => onUpdateSetting('ai_response_style', v)}
                    options={[
                        { value: 'brief', label: 'Brief' }, { value: 'balanced', label: 'Balanced' },
                        { value: 'detailed', label: 'Detailed' },
                    ]} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="💡" title="Smart Suggestions" description="AI-powered content recommendations">
            <SettingRow label="Content Suggestions" description="Focusly suggests content based on your interests">
                <Toggle checked={settings?.ai_content_suggestions ?? true} onChange={(v) => onUpdateSetting('ai_content_suggestions', v)} />
            </SettingRow>
            <SettingRow label="Writing Assistance" description="Get help composing posts and messages">
                <Toggle checked={settings?.ai_writing_assist ?? true} onChange={(v) => onUpdateSetting('ai_writing_assist', v)} />
            </SettingRow>
            <SettingRow label="Safety Suggestions" description="AI alerts for potential safety concerns" noBorder>
                <Toggle checked={settings?.ai_safety_suggestions ?? true} onChange={(v) => onUpdateSetting('ai_safety_suggestions', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="🦁" title="Mascot Settings" description="Customize the Focusly mascot">
            <SettingRow label="Show Mascot" description="Display the Focusly mascot in the app">
                <Toggle checked={settings?.show_mascot ?? true} onChange={(v) => onUpdateSetting('show_mascot', v)} />
            </SettingRow>
            <SettingRow label="Mascot Emotion" description="Choose mascot's default expression">
                <SettingSelect value={settings?.mascot_emotion || 'happy'} onChange={(v) => onUpdateSetting('mascot_emotion', v)}
                    options={[
                        { value: 'happy', label: '😊 Happy' }, { value: 'excited', label: '🤩 Excited' },
                        { value: 'calm', label: '😌 Calm' }, { value: 'cool', label: '😎 Cool' },
                    ]} />
            </SettingRow>
            <SettingRow label="Mascot Animations" description="Enable mascot animated reactions" noBorder>
                <Toggle checked={settings?.mascot_animations ?? true} onChange={(v) => onUpdateSetting('mascot_animations', v)} />
            </SettingRow>
        </SettingsGlassTile>

        <SettingsGlassTile icon="🔒" title="AI Privacy" description="Control how AI uses your data">
            <SettingRow label="Use Data for AI Training" description="Allow anonymized data to improve Focusly AI">
                <Toggle checked={settings?.ai_data_training ?? false} onChange={(v) => onUpdateSetting('ai_data_training', v)} />
            </SettingRow>
            <SettingRow label="Conversation History" description="Store AI conversation history for better responses" noBorder>
                <Toggle checked={settings?.ai_history ?? true} onChange={(v) => onUpdateSetting('ai_history', v)} />
            </SettingRow>
        </SettingsGlassTile>
    </>
);

export default FocuslyAISettingsSection;
