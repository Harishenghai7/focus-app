import { Howl } from 'howler';

/**
 * Sound Library using Howler.js
 * Manages all sound effects for Focusly AI
 */

class SoundLibrary {
    constructor() {
        this.sounds = {};
        this.volume = 0.7;
        this.enabled = true;
        this.initialized = false;
    }

    /**
     * Initialize sound library
     */
    init() {
        if (this.initialized) return;

        try {
            // Load sound effects
            this.sounds = {
                notification: new Howl({
                    src: ['/sounds/notification.mp3'],
                    volume: this.volume,
                    preload: true
                }),
                achievement: new Howl({
                    src: ['/sounds/achievement.mp3'],
                    volume: this.volume,
                    preload: true
                }),
                sadSound: new Howl({
                    src: ['/sounds/sad-sound.mp3'],
                    volume: this.volume * 0.5,
                    preload: true
                }),
                celebration: new Howl({
                    src: ['/sounds/celebration.mp3'],
                    volume: this.volume,
                    preload: true
                }),
                open: new Howl({
                    src: ['/sounds/open.mp3'],
                    volume: this.volume * 0.6,
                    preload: true
                }),
                close: new Howl({
                    src: ['/sounds/close.mp3'],
                    volume: this.volume * 0.6,
                    preload: true
                }),
                click: new Howl({
                    src: ['/sounds/click.mp3'],
                    volume: this.volume * 0.4,
                    preload: true
                }),
                message: new Howl({
                    src: ['/sounds/message.mp3'],
                    volume: this.volume * 0.5,
                    preload: true
                }),
                thinking: new Howl({
                    src: ['/sounds/thinking.mp3'],
                    volume: this.volume * 0.3,
                    preload: true,
                    loop: true
                })
            };

            this.initialized = true;

        } catch (error) {
            console.error('❌ Failed to initialize sound library:', error);
        }
    }

    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound to play
     * @param {Object} options - Additional options (volume, fade, etc.)
     */
    play(soundName, options = {}) {
        if (!this.enabled) return;
        if (!this.initialized) this.init();

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        try {
            // Apply custom volume if provided
            if (options.volume !== undefined) {
                sound.volume(options.volume);
            }

            // Fade in if specified
            if (options.fadeIn) {
                sound.fade(0, sound.volume(), options.fadeIn);
            }

            sound.play();

            // Fade out if specified
            if (options.fadeOut && options.duration) {
                setTimeout(() => {
                    sound.fade(sound.volume(), 0, options.fadeOut);
                }, options.duration - options.fadeOut);
            }
        } catch (error) {
            console.error(`Error playing sound ${soundName}:`, error);
        }
    }

    /**
     * Stop a sound
     * @param {string} soundName - Name of the sound to stop
     */
    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.stop();
        }
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        Object.values(this.sounds).forEach(sound => sound.stop());
    }

    /**
     * Set global volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume(this.volume);
        });
    }

    /**
     * Enable/disable sound effects
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAll();
        }
    }

    /**
     * Play emotion-based sound
     * @param {string} emotion
     */
    playEmotionSound(emotion) {
        const emotionSounds = {
            happy: 'achievement',
            excited: 'celebration',
            sad: 'sadSound',
            celebrating: 'celebration',
            surprised: 'notification'
        };

        const soundName = emotionSounds[emotion];
        if (soundName) {
            this.play(soundName);
        }
    }

    /**
     * Play event sound
     * @param {string} event
     */
    playEventSound(event) {
        const eventSounds = {
            open: 'open',
            close: 'close',
            click: 'click',
            message: 'message',
            notification: 'notification'
        };

        const soundName = eventSounds[event];
        if (soundName) {
            this.play(soundName);
        }
    }

    /**
     * Play thinking sound (looped)
     */
    startThinking() {
        this.play('thinking', { volume: 0.2 });
    }

    /**
     * Stop thinking sound
     */
    stopThinking() {
        this.stop('thinking');
    }
}

// Export singleton instance
const soundLibrary = new SoundLibrary();
export default soundLibrary;
