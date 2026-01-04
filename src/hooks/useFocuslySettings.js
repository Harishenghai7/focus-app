import { useState, useCallback } from 'react';

/**
 * Focusly Settings Hook
 * Manages all Focusly AI settings with localStorage persistence
 */
const useFocuslySettings = () => {
    const SETTINGS_KEY = 'focusly_settings';

    // Default settings
    const defaultSettings = {
        voice: {
            enabled: true,
            rate: 1.1,
            pitch: 1.2,
            volume: 1.0,
            voiceName: null // Auto-select best voice
        },
        animation: {
            speed: 1.0, // 0.5 = slow, 1.0 = normal, 1.5 = fast
            particlesEnabled: true,
            blinkingEnabled: true,
            breathingEnabled: true
        },
        personality: {
            mode: 'friendly', // 'friendly', 'professional', 'playful', 'supportive'
            emoji: true,
            verbosity: 'medium' // 'concise', 'medium', 'detailed'
        },
        sound: {
            enabled: true,
            volume: 0.7,
            notificationSounds: true,
            emotionSounds: true,
            eventSounds: true
        },
        behavior: {
            proactiveMessages: true,
            contextAwareness: true,
            conversationMemory: true,
            autoGreeting: true
        },
        ui: {
            theme: 'auto', // 'light', 'dark', 'auto'
            position: { x: null, y: null }, // null = default position
            size: 'medium' // 'small', 'medium', 'large'
        },
        privacy: {
            saveConversations: true,
            analytics: true
        }
    };

    // Load settings from localStorage
    const loadSettings = () => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new settings
                return {
                    ...defaultSettings,
                    ...parsed,
                    voice: { ...defaultSettings.voice, ...parsed.voice },
                    animation: { ...defaultSettings.animation, ...parsed.animation },
                    personality: { ...defaultSettings.personality, ...parsed.personality },
                    sound: { ...defaultSettings.sound, ...parsed.sound },
                    behavior: { ...defaultSettings.behavior, ...parsed.behavior },
                    ui: { ...defaultSettings.ui, ...parsed.ui },
                    privacy: { ...defaultSettings.privacy, ...parsed.privacy }
                };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return defaultSettings;
    };

    const [settings, setSettings] = useState(loadSettings);

    // Save settings to localStorage
    const saveSettings = useCallback((newSettings) => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, []);

    /**
     * Update a specific setting
     */
    const updateSetting = useCallback((category, key, value) => {
        const newSettings = {
            ...settings,
            [category]: {
                ...settings[category],
                [key]: value
            }
        };
        saveSettings(newSettings);
    }, [settings, saveSettings]);

    /**
     * Update multiple settings at once
     */
    const updateSettings = useCallback((updates) => {
        const newSettings = { ...settings };

        Object.entries(updates).forEach(([category, values]) => {
            newSettings[category] = {
                ...newSettings[category],
                ...values
            };
        });

        saveSettings(newSettings);
    }, [settings, saveSettings]);

    /**
     * Reset to defaults
     */
    const resetToDefaults = useCallback(() => {
        saveSettings(defaultSettings);
    }, [saveSettings]);

    /**
     * Reset specific category
     */
    const resetCategory = useCallback((category) => {
        const newSettings = {
            ...settings,
            [category]: defaultSettings[category]
        };
        saveSettings(newSettings);
    }, [settings, saveSettings]);

    // Individual setters for common settings
    const toggleVoice = useCallback(() => {
        updateSetting('voice', 'enabled', !settings.voice.enabled);
    }, [settings, updateSetting]);

    const toggleSound = useCallback(() => {
        updateSetting('sound', 'enabled', !settings.sound.enabled);
    }, [settings, updateSetting]);

    const setVoiceRate = useCallback((rate) => {
        updateSetting('voice', 'rate', rate);
    }, [updateSetting]);

    const setVoicePitch = useCallback((pitch) => {
        updateSetting('voice', 'pitch', pitch);
    }, [updateSetting]);

    const setVoiceVolume = useCallback((volume) => {
        updateSetting('voice', 'volume', volume);
    }, [updateSetting]);

    const setSoundVolume = useCallback((volume) => {
        updateSetting('sound', 'volume', volume);
    }, [updateSetting]);

    const setAnimationSpeed = useCallback((speed) => {
        updateSetting('animation', 'speed', speed);
    }, [updateSetting]);

    const setPersonalityMode = useCallback((mode) => {
        updateSetting('personality', 'mode', mode);
    }, [updateSetting]);

    const toggleParticles = useCallback(() => {
        updateSetting('animation', 'particlesEnabled', !settings.animation.particlesEnabled);
    }, [settings, updateSetting]);

    const toggleProactiveMessages = useCallback(() => {
        updateSetting('behavior', 'proactiveMessages', !settings.behavior.proactiveMessages);
    }, [settings, updateSetting]);

    const toggleConversationMemory = useCallback(() => {
        updateSetting('behavior', 'conversationMemory', !settings.behavior.conversationMemory);
    }, [settings, updateSetting]);

    const setUISize = useCallback((size) => {
        updateSetting('ui', 'size', size);
    }, [updateSetting]);

    const setUIPosition = useCallback((position) => {
        updateSetting('ui', 'position', position);
    }, [updateSetting]);

    /**
     * Export settings
     */
    const exportSettings = useCallback(() => {
        return JSON.stringify(settings, null, 2);
    }, [settings]);

    /**
     * Import settings
     */
    const importSettings = useCallback((settingsJson) => {
        try {
            const imported = JSON.parse(settingsJson);
            saveSettings(imported);
            return true;
        } catch (error) {
            console.error('Error importing settings:', error);
            return false;
        }
    }, [saveSettings]);

    return {
        settings,
        updateSetting,
        updateSettings,
        resetToDefaults,
        resetCategory,

        // Quick toggles
        toggleVoice,
        toggleSound,
        toggleParticles,
        toggleProactiveMessages,
        toggleConversationMemory,

        // Setters
        setVoiceRate,
        setVoicePitch,
        setVoiceVolume,
        setSoundVolume,
        setAnimationSpeed,
        setPersonalityMode,
        setUISize,
        setUIPosition,

        // Import/Export
        exportSettings,
        importSettings
    };
};

export default useFocuslySettings;
