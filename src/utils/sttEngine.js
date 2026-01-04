/**
 * Speech-to-Text Engine for Focusly AI
 * Uses Web Speech API for voice recognition
 */

class STTEngine {
    constructor() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            this.recognition = null;
            this.isSupported = false;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.isSupported = true;
        this.isListening = false;
        this.finalTranscript = '';
        this.interimTranscript = '';

        // Configuration
        this.recognition.continuous = false; // Stop after one result
        this.recognition.interimResults = true; // Get interim results
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Callbacks
        this.callbacks = {
            onStart: null,
            onResult: null,
            onInterim: null,
            onEnd: null,
            onError: null
        };

        this.setupEventHandlers();
    }

    /**
     * Setup event handlers for speech recognition
     */
    setupEventHandlers() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.finalTranscript = '';
            this.interimTranscript = '';

            if (this.callbacks.onStart) {
                this.callbacks.onStart();
            }
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (final) {
                this.finalTranscript += final;
                if (this.callbacks.onResult) {
                    this.callbacks.onResult(this.finalTranscript);
                }
            }

            if (interim) {
                this.interimTranscript = interim;
                if (this.callbacks.onInterim) {
                    this.callbacks.onInterim(interim);
                }
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;

            if (this.callbacks.onEnd) {
                this.callbacks.onEnd(this.finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            console.error('Speech recognition error:', event.error);

            if (this.callbacks.onError) {
                this.callbacks.onError(event.error);
            }
        };

        this.recognition.onnomatch = () => {
            console.warn('Speech not recognized');
        };
    }

    /**
     * Start listening for speech
     * @returns {Promise} Resolves with final transcript
     */
    start() {
        return new Promise((resolve, reject) => {
            if (!this.isSupported) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            if (this.isListening) {
                reject(new Error('Already listening'));
                return;
            }

            // Set up one-time result handler
            const originalOnEnd = this.callbacks.onEnd;
            this.callbacks.onEnd = (transcript) => {
                // Restore original callback
                this.callbacks.onEnd = originalOnEnd;

                // Call original if exists
                if (originalOnEnd) {
                    originalOnEnd(transcript);
                }

                // Resolve promise
                resolve(transcript);
            };

            // Set up one-time error handler
            const originalOnError = this.callbacks.onError;
            this.callbacks.onError = (error) => {
                // Restore original callback
                this.callbacks.onError = originalOnError;

                // Call original if exists
                if (originalOnError) {
                    originalOnError(error);
                }

                // Reject promise
                reject(new Error(error));
            };

            try {
                this.recognition.start();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop listening
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Abort listening immediately
     */
    abort() {
        if (this.recognition && this.isListening) {
            this.recognition.abort();
            this.isListening = false;
        }
    }

    /**
     * Start continuous listening mode
     */
    startContinuous() {
        if (!this.isSupported) {
            console.error('Speech recognition not supported');
            return;
        }

        this.recognition.continuous = true;

        // Auto-restart on end for continuous mode
        const originalOnEnd = this.callbacks.onEnd;
        this.callbacks.onEnd = (transcript) => {
            if (originalOnEnd) {
                originalOnEnd(transcript);
            }

            // Restart if still in continuous mode
            if (this.recognition.continuous) {
                setTimeout(() => {
                    try {
                        this.recognition.start();
                    } catch (error) {
                        console.error('Failed to restart recognition:', error);
                    }
                }, 100);
            }
        };

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start continuous recognition:', error);
        }
    }

    /**
     * Stop continuous listening mode
     */
    stopContinuous() {
        this.recognition.continuous = false;
        this.stop();
    }

    /**
     * Set language for recognition
     * @param {string} lang - Language code (e.g., 'en-US', 'es-ES')
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * Set event callbacks
     * @param {Object} callbacks - Event callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Get current transcript
     */
    getTranscript() {
        return {
            final: this.finalTranscript,
            interim: this.interimTranscript
        };
    }

    /**
     * Check if browser supports speech recognition
     */
    static isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * Get supported languages (common ones)
     */
    static getSupportedLanguages() {
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'es-ES', name: 'Spanish (Spain)' },
            { code: 'es-MX', name: 'Spanish (Mexico)' },
            { code: 'fr-FR', name: 'French' },
            { code: 'de-DE', name: 'German' },
            { code: 'it-IT', name: 'Italian' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' },
            { code: 'ja-JP', name: 'Japanese' },
            { code: 'ko-KR', name: 'Korean' },
            { code: 'hi-IN', name: 'Hindi' }
        ];
    }

    /**
     * Request microphone permission
     * @returns {Promise<boolean>} True if permission granted
     */
    static async requestPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    }
}

// Create singleton instance
const sttEngine = new STTEngine();

export default sttEngine;
export { STTEngine };
