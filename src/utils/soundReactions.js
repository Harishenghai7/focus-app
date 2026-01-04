/**
 * Sound Reactions for Focusly Avatar
 * Plays sound effects for various avatar reactions and events
 */

// Sound effect URLs (using data URIs for simple beeps, or can be replaced with actual audio files)
const SOUNDS = {
    // Notification sounds
    notification: null, // Will use system beep
    achievement: null,

    // Reaction sounds
    happy: null,
    excited: null,
    sad: null,

    // Interaction sounds
    pop: null,
    whoosh: null,
    click: null
};

class SoundReactionsEngine {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.volume = 0.3; // Default volume (0-1)
        this.enabled = true;
        this.init();
    }

    /**
     * Initialize audio context
     */
    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    /**
     * Play a beep sound with specified frequency and duration
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in milliseconds
     * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
     */
    playBeep(frequency = 440, duration = 200, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + duration / 1000
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.error('Failed to play beep:', error);
        }
    }

    /**
     * Play notification sound
     */
    playNotification() {
        // Pleasant notification beep
        this.playBeep(800, 100, 'sine');
        setTimeout(() => this.playBeep(1000, 100, 'sine'), 100);
    }

    /**
     * Play achievement sound
     */
    playAchievement() {
        // Triumphant ascending tones
        this.playBeep(523, 100, 'sine'); // C
        setTimeout(() => this.playBeep(659, 100, 'sine'), 100); // E
        setTimeout(() => this.playBeep(784, 200, 'sine'), 200); // G
    }

    /**
     * Play happy sound
     */
    playHappy() {
        // Cheerful ascending chirp
        this.playBeep(600, 80, 'sine');
        setTimeout(() => this.playBeep(800, 80, 'sine'), 80);
        setTimeout(() => this.playBeep(1000, 120, 'sine'), 160);
    }

    /**
     * Play excited sound
     */
    playExcited() {
        // Rapid ascending beeps
        this.playBeep(700, 60, 'square');
        setTimeout(() => this.playBeep(900, 60, 'square'), 60);
        setTimeout(() => this.playBeep(1100, 60, 'square'), 120);
        setTimeout(() => this.playBeep(1300, 100, 'square'), 180);
    }

    /**
     * Play sad sound
     */
    playSad() {
        // Descending tones
        this.playBeep(500, 150, 'sine');
        setTimeout(() => this.playBeep(400, 150, 'sine'), 150);
        setTimeout(() => this.playBeep(300, 200, 'sine'), 300);
    }

    /**
     * Play pop sound (for UI interactions)
     */
    playPop() {
        this.playBeep(800, 50, 'sine');
    }

    /**
     * Play whoosh sound (for transitions)
     */
    playWhoosh() {
        if (!this.enabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Sweep from high to low
            oscillator.frequency.setValueAtTime(1500, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                300,
                this.audioContext.currentTime + 0.3
            );
            oscillator.type = 'sawtooth';

            gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + 0.3
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.error('Failed to play whoosh:', error);
        }
    }

    /**
     * Play click sound
     */
    playClick() {
        this.playBeep(1200, 30, 'square');
    }

    /**
     * Play error sound
     */
    playError() {
        this.playBeep(200, 200, 'sawtooth');
    }

    /**
     * Play success sound
     */
    playSuccess() {
        this.playBeep(800, 100, 'sine');
        setTimeout(() => this.playBeep(1000, 150, 'sine'), 100);
    }

    /**
     * Play thinking sound (subtle loop)
     */
    playThinking() {
        this.playBeep(400, 100, 'sine');
        setTimeout(() => this.playBeep(450, 100, 'sine'), 200);
    }

    /**
     * Play reaction based on emotion
     * @param {string} emotion - Emotion name
     */
    playEmotionReaction(emotion) {
        const emotionSounds = {
            happy: () => this.playHappy(),
            excited: () => this.playExcited(),
            sad: () => this.playSad(),
            surprised: () => this.playExcited(),
            thinking: () => this.playThinking(),
            achievement: () => this.playAchievement(),
            error: () => this.playError(),
            success: () => this.playSuccess()
        };

        const soundFn = emotionSounds[emotion];
        if (soundFn) {
            soundFn();
        }
    }

    /**
     * Play event-based sound
     * @param {string} eventType - Event type
     */
    playEventSound(eventType) {
        const eventSounds = {
            message: () => this.playNotification(),
            like: () => this.playPop(),
            follow: () => this.playSuccess(),
            achievement: () => this.playAchievement(),
            error: () => this.playError(),
            open: () => this.playWhoosh(),
            close: () => this.playWhoosh(),
            click: () => this.playClick()
        };

        const soundFn = eventSounds[eventType];
        if (soundFn) {
            soundFn();
        }
    }

    /**
     * Set volume
     * @param {number} volume - Volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Enable/disable sounds
     * @param {boolean} enabled - Enable sounds
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Get current settings
     */
    getSettings() {
        return {
            volume: this.volume,
            enabled: this.enabled
        };
    }

    /**
     * Load settings from preferences
     * @param {Object} preferences - User preferences
     */
    loadSettings(preferences) {
        if (preferences.soundEffectsEnabled !== undefined) {
            this.enabled = preferences.soundEffectsEnabled;
        }
        if (preferences.soundVolume !== undefined) {
            this.volume = preferences.soundVolume;
        }
    }
}

// Create singleton instance
const soundReactions = new SoundReactionsEngine();

export default soundReactions;
export { SoundReactionsEngine };
