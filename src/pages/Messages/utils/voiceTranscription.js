/* ═══════════════════════════════════════════════════════════════════════
   VOICE TRANSCRIPTION - Using Web Speech API (FREE!)
   Phase 5: Future Enhancements
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Transcribe voice message using Web Speech API
 * FREE - No API key needed!
 */
export const transcribeVoiceMessage = async (audioBlob) => {
    return new Promise((resolve, reject) => {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            reject(new Error('Speech recognition not supported'));
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        // Convert blob to audio element
        const audio = new Audio(URL.createObjectURL(audioBlob));

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            resolve(transcript);
        };

        recognition.onerror = (event) => {
            reject(new Error(`Transcription failed: ${event.error}`));
        };

        // Play audio and start recognition
        audio.play();
        recognition.start();

        // Stop recognition when audio ends
        audio.onended = () => {
            recognition.stop();
        };
    });
};

/**
 * Auto-transcribe voice message on upload
 */
export const autoTranscribeVoice = async (voiceUrl) => {
    try {
        // Fetch audio
        const response = await fetch(voiceUrl);
        const blob = await response.blob();

        // Transcribe
        const transcript = await transcribeVoiceMessage(blob);

        return transcript;
    } catch (error) {
        console.error('Auto-transcription failed:', error);
        return null;
    }
};

/**
 * Live transcription during recording
 */
export class LiveTranscription {
    constructor() {
        this.recognition = null;
        this.transcript = '';
        this.onUpdate = null;
    }

    start(onUpdate) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.onUpdate = onUpdate;

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            this.transcript = finalTranscript;
            if (this.onUpdate) {
                this.onUpdate({
                    final: finalTranscript,
                    interim: interimTranscript
                });
            }
        };

        this.recognition.start();
    }

    stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
        return this.transcript;
    }
}
