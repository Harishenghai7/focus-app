/**
 * Text-to-Speech Engine for Focusly AI
 * Uses Web Speech API with customizable voice settings
 */

class TTSEngine {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.queue = [];
        this.isInitialized = false;
        this.settings = {
            rate: 1.1, // Slightly faster for energetic personality
            pitch: 1.2, // Higher pitch for friendly lion voice
            volume: 0.8,
            voiceName: null // Will be set to best available voice
        };
        this.callbacks = {
            onStart: null,
            onEnd: null,
            onBoundary: null,
            onError: null
        };

        this.init();
    }

    /**
     * Initialize TTS engine and load voices
     */
    init() {
        if (!this.synth) {
            console.warn('Speech Synthesis not supported in this browser');
            return;
        }

        // Load voices (may need to wait for voiceschanged event)
        const loadVoices = () => {
            this.voices = this.synth.getVoices();

            if (this.voices.length > 0) {
                this.isInitialized = true;
                this.selectBestVoice();
            }
        };

        loadVoices();

        // Voices may load asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    /**
     * Select the best available voice for Focusly
     * Prefers: English, female, natural-sounding
     */
    selectBestVoice() {
        if (this.voices.length === 0) return null;

        // Priority order for voice selection
        const priorities = [
            // Google voices (high quality)
            (v) => v.name.includes('Google') && v.lang.startsWith('en') && v.name.includes('Female'),
            (v) => v.name.includes('Google') && v.lang.startsWith('en'),
            // Microsoft voices
            (v) => v.name.includes('Microsoft') && v.lang.startsWith('en') && v.name.includes('Zira'),
            (v) => v.name.includes('Microsoft') && v.lang.startsWith('en'),
            // Apple voices
            (v) => v.name.includes('Samantha') || v.name.includes('Victoria'),
            // Any English female voice
            (v) => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')),
            // Any English voice
            (v) => v.lang.startsWith('en'),
            // Fallback to first available
            (v) => true
        ];

        for (const priorityFn of priorities) {
            const voice = this.voices.find(priorityFn);
            if (voice) {
                this.settings.voiceName = voice.name;
                return voice;
            }
        }

        return this.voices[0];
    }

    /**
     * Get selected voice object
     */
    getVoice() {
        if (!this.settings.voiceName) {
            return this.selectBestVoice();
        }
        return this.voices.find(v => v.name === this.settings.voiceName) || this.voices[0];
    }

    /**
     * Speak text with current settings
     * @param {string} text - Text to speak
     * @param {Object} options - Override settings for this utterance
     * @returns {Promise} Resolves when speech completes
     */
    speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.synth) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            // Cancel any ongoing speech
            if (this.currentUtterance) {
                this.synth.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            const voice = this.getVoice();

            if (voice) {
                utterance.voice = voice;
            }

            // Apply settings
            utterance.rate = options.rate || this.settings.rate;
            utterance.pitch = options.pitch || this.settings.pitch;
            utterance.volume = options.volume || this.settings.volume;

            // Event handlers
            utterance.onstart = (event) => {
                if (this.callbacks.onStart) {
                    this.callbacks.onStart(event);
                }
            };

            utterance.onend = (event) => {
                this.currentUtterance = null;
                if (this.callbacks.onEnd) {
                    this.callbacks.onEnd(event);
                }
                resolve();
            };

            utterance.onboundary = (event) => {
                if (this.callbacks.onBoundary) {
                    this.callbacks.onBoundary(event);
                }
            };

            utterance.onerror = (event) => {
                this.currentUtterance = null;
                if (this.callbacks.onError) {
                    this.callbacks.onError(event);
                }
                reject(event);
            };

            this.currentUtterance = utterance;
            this.synth.speak(utterance);
        });
    }

    /**
     * Add text to speech queue
     * @param {string} text - Text to queue
     * @param {Object} options - Speech options
     */
    enqueue(text, options = {}) {
        this.queue.push({ text, options });
        if (!this.currentUtterance) {
            this.processQueue();
        }
    }

    /**
     * Process speech queue
     */
    async processQueue() {
        while (this.queue.length > 0) {
            const { text, options } = this.queue.shift();
            try {
                await this.speak(text, options);
            } catch (error) {
                console.error('TTS error:', error);
            }
        }
    }

    /**
     * Pause current speech
     */
    pause() {
        if (this.synth && this.synth.speaking) {
            this.synth.pause();
        }
    }

    /**
     * Resume paused speech
     */
    resume() {
        if (this.synth && this.synth.paused) {
            this.synth.resume();
        }
    }

    /**
     * Stop current speech and clear queue
     */
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
        this.currentUtterance = null;
        this.queue = [];
    }

    /**
     * Check if currently speaking
     */
    isSpeaking() {
        return this.synth && this.synth.speaking;
    }

    /**
     * Update settings
     * @param {Object} newSettings - Settings to update
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Get available voices
     */
    getVoices() {
        return this.voices;
    }

    /**
     * Set event callbacks
     * @param {Object} callbacks - Event callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Get voice pack presets
     */
    static getVoicePacks() {
        return {
            energetic: {
                name: 'Energetic',
                rate: 1.2,
                pitch: 1.3,
                description: 'Fast and upbeat'
            },
            calm: {
                name: 'Calm',
                rate: 0.9,
                pitch: 1.0,
                description: 'Slow and soothing'
            },
            motivational: {
                name: 'Motivational',
                rate: 1.1,
                pitch: 1.2,
                description: 'Encouraging and positive'
            },
            friendly: {
                name: 'Friendly',
                rate: 1.0,
                pitch: 1.1,
                description: 'Warm and welcoming'
            },
            professional: {
                name: 'Professional',
                rate: 1.0,
                pitch: 1.0,
                description: 'Clear and neutral'
            }
        };
    }

    /**
     * Apply voice pack preset
     * @param {string} packName - Name of voice pack
     */
    applyVoicePack(packName) {
        const packs = TTSEngine.getVoicePacks();
        const pack = packs[packName];

        if (pack) {
            this.updateSettings({
                rate: pack.rate,
                pitch: pack.pitch
            });
        }
    }
}

// Create singleton instance
const ttsEngine = new TTSEngine();

export default ttsEngine;
export { TTSEngine };
