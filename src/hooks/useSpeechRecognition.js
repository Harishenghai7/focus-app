import { useState, useEffect, useRef } from 'react';

/**
 * Speech Recognition Hook
 * Provides voice input functionality using Web Speech API
 */
const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef('');

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            console.warn('Speech Recognition API not supported in this browser');
            return;
        }

        setIsSupported(true);
        const recognition = new SpeechRecognition();

        // Configuration
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        // Event handlers
        recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcriptText = result[0].transcript;

                if (result.isFinal) {
                    final += transcriptText + ' ';
                } else {
                    interim += transcriptText;
                }
            }

            if (final) {
                finalTranscriptRef.current += final;
                setTranscript(finalTranscriptRef.current.trim());
            }

            setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setError(event.error);
            setIsListening(false);

            // Handle specific errors
            if (event.error === 'no-speech') {
                setError('No speech detected. Please try again.');
            } else if (event.error === 'audio-capture') {
                setError('Microphone not accessible. Please check permissions.');
            } else if (event.error === 'not-allowed') {
                setError('Microphone permission denied.');
            }
        };

        recognition.onend = () => {
            console.log('🎤 Speech recognition ended');
            setIsListening(false);
            setInterimTranscript('');
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    /**
     * Start listening
     */
    const startListening = () => {
        if (!recognitionRef.current || !isSupported) {
            console.warn('Speech recognition not available');
            return;
        }

        try {
            finalTranscriptRef.current = '';
            setTranscript('');
            setInterimTranscript('');
            setError(null);
            recognitionRef.current.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            if (error.message.includes('already started')) {
                // Already running, stop and restart
                stopListening();
                setTimeout(startListening, 100);
            }
        }
    };

    /**
     * Stop listening
     */
    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    /**
     * Reset transcript
     */
    const resetTranscript = () => {
        finalTranscriptRef.current = '';
        setTranscript('');
        setInterimTranscript('');
    };

    /**
     * Check microphone permissions
     */
    const checkPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            setError('Microphone access denied');
            return false;
        }
    };

    return {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript,
        checkPermissions
    };
};

export default useSpeechRecognition;
