import { useState, useEffect, useCallback, useRef } from 'react';
import ttsEngine from '../utils/ttsEngine';
import { getPreferences, savePreferences } from '../utils/focuslyContextMemory';

/**
 * Custom hook for Focusly voice synthesis
 * Manages TTS engine, voice settings, and speech playback
 */
export const useFocuslyVoice = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [settings, setSettings] = useState({
        enabled: true,
        rate: 1.1,
        pitch: 1.2,
        volume: 0.8,
        voicePack: 'energetic'
    });
    const [availableVoices, setAvailableVoices] = useState([]);
    const speechCallbacks = useRef({});

    // Load settings and voices on mount
    useEffect(() => {
        const prefs = getPreferences();
        if (prefs.voiceEnabled !== undefined) {
            setSettings(prev => ({
                ...prev,
                enabled: prefs.voiceEnabled,
                rate: prefs.voiceRate || prev.rate,
                pitch: prefs.voicePitch || prev.pitch,
                volume: prefs.voiceVolume || prev.volume,
                voicePack: prefs.voicePack || prev.voicePack
            }));
        }

        // Load available voices
        const voices = ttsEngine.getVoices();
        setAvailableVoices(voices);

        // Apply voice pack
        if (prefs.voicePack) {
            ttsEngine.applyVoicePack(prefs.voicePack);
        }
    }, []);

    // Setup TTS callbacks
    useEffect(() => {
        ttsEngine.setCallbacks({
            onStart: (event) => {
                setIsSpeaking(true);
                setIsPaused(false);
                if (speechCallbacks.current.onStart) {
                    speechCallbacks.current.onStart(event);
                }
            },
            onEnd: (event) => {
                setIsSpeaking(false);
                setIsPaused(false);
                setCurrentText('');
                if (speechCallbacks.current.onEnd) {
                    speechCallbacks.current.onEnd(event);
                }
            },
            onBoundary: (event) => {
                if (speechCallbacks.current.onBoundary) {
                    speechCallbacks.current.onBoundary(event);
                }
            },
            onError: (event) => {
                setIsSpeaking(false);
                setIsPaused(false);
                console.error('TTS error:', event);
                if (speechCallbacks.current.onError) {
                    speechCallbacks.current.onError(event);
                }
            }
        });
    }, []);

    /**
     * Speak text
     * @param {string} text - Text to speak
     * @param {Object} options - Override options
     * @returns {Promise} Resolves when speech completes
     */
    const speak = useCallback(async (text, options = {}) => {
        if (!settings.enabled || !text) {
            return Promise.resolve();
        }

        setCurrentText(text);

        try {
            await ttsEngine.speak(text, {
                rate: options.rate || settings.rate,
                pitch: options.pitch || settings.pitch,
                volume: options.volume || settings.volume
            });
        } catch (error) {
            console.error('Speech failed:', error);
        }
    }, [settings]);

    /**
     * Add text to speech queue
     * @param {string} text - Text to queue
     */
    const enqueue = useCallback((text) => {
        if (!settings.enabled || !text) return;
        ttsEngine.enqueue(text);
    }, [settings.enabled]);

    /**
     * Pause current speech
     */
    const pause = useCallback(() => {
        ttsEngine.pause();
        setIsPaused(true);
    }, []);

    /**
     * Resume paused speech
     */
    const resume = useCallback(() => {
        ttsEngine.resume();
        setIsPaused(false);
    }, []);

    /**
     * Stop current speech
     */
    const stop = useCallback(() => {
        ttsEngine.stop();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
    }, []);

    /**
     * Toggle voice enabled/disabled
     */
    const toggleEnabled = useCallback(() => {
        setSettings(prev => {
            const newEnabled = !prev.enabled;
            savePreferences({ voiceEnabled: newEnabled });
            return { ...prev, enabled: newEnabled };
        });
    }, []);

    /**
     * Update voice settings
     * @param {Object} newSettings - Settings to update
     */
    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };

            // Save to preferences
            savePreferences({
                voiceEnabled: updated.enabled,
                voiceRate: updated.rate,
                voicePitch: updated.pitch,
                voiceVolume: updated.volume,
                voicePack: updated.voicePack
            });

            // Update TTS engine
            ttsEngine.updateSettings({
                rate: updated.rate,
                pitch: updated.pitch,
                volume: updated.volume
            });

            return updated;
        });
    }, []);

    /**
     * Apply voice pack preset
     * @param {string} packName - Voice pack name
     */
    const applyVoicePack = useCallback((packName) => {
        ttsEngine.applyVoicePack(packName);
        setSettings(prev => {
            const updated = { ...prev, voicePack: packName };
            savePreferences({ voicePack: packName });
            return updated;
        });
    }, []);

    /**
     * Get available voice packs
     */
    const getVoicePacks = useCallback(() => {
        return ttsEngine.constructor.getVoicePacks();
    }, []);

    /**
     * Set speech event callbacks
     * @param {Object} callbacks - Event callbacks
     */
    const setCallbacks = useCallback((callbacks) => {
        speechCallbacks.current = callbacks;
    }, []);

    return {
        isSpeaking,
        isPaused,
        currentText,
        settings,
        availableVoices,
        speak,
        enqueue,
        pause,
        resume,
        stop,
        toggleEnabled,
        updateSettings,
        applyVoicePack,
        getVoicePacks,
        setCallbacks
    };
};

export default useFocuslyVoice;
