import React, { useEffect, useState } from 'react';
import styles from './FocuslyDiagnostics.module.css';

/**
 * Focusly Diagnostics Component
 * Shows API status and helps debug issues
 */
const FocuslyDiagnostics = () => {
    const [diagnostics, setDiagnostics] = useState({
        apiKey: null,
        apiKeyLength: 0,
        apiKeyPreview: '',
        browserSupport: {
            speechSynthesis: false,
            speechRecognition: false,
            webAudio: false
        }
    });

    useEffect(() => {
        // Check API key
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        // Check browser support
        const browserSupport = {
            speechSynthesis: 'speechSynthesis' in window,
            speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window
        };

        setDiagnostics({
            apiKey: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0,
            apiKeyPreview: apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT SET',
            browserSupport
        });
    }, []);

    return (
        <div className={styles.diagnostics}>
            <h3>🦁 Focusly AI Diagnostics</h3>

            <div className={styles.section}>
                <h4>Gemini API Status</h4>
                <div className={styles.status}>
                    <span className={styles.label}>API Key:</span>
                    <span className={diagnostics.apiKey ? styles.success : styles.error}>
                        {diagnostics.apiKey ? '✅ Set' : '❌ Not Set'}
                    </span>
                </div>
                {diagnostics.apiKey && (
                    <>
                        <div className={styles.status}>
                            <span className={styles.label}>Key Length:</span>
                            <span>{diagnostics.apiKeyLength} characters</span>
                        </div>
                        <div className={styles.status}>
                            <span className={styles.label}>Key Preview:</span>
                            <span className={styles.code}>{diagnostics.apiKeyPreview}</span>
                        </div>
                    </>
                )}
                {!diagnostics.apiKey && (
                    <div className={styles.warning}>
                        <p>⚠️ Gemini API key is not set!</p>
                        <p>Add <code>REACT_APP_GEMINI_API_KEY</code> to your .env file</p>
                        <p>Get your key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></p>
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <h4>Browser Support</h4>
                <div className={styles.status}>
                    <span className={styles.label}>Speech Synthesis (TTS):</span>
                    <span className={diagnostics.browserSupport.speechSynthesis ? styles.success : styles.error}>
                        {diagnostics.browserSupport.speechSynthesis ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                </div>
                <div className={styles.status}>
                    <span className={styles.label}>Speech Recognition (STT):</span>
                    <span className={diagnostics.browserSupport.speechRecognition ? styles.success : styles.error}>
                        {diagnostics.browserSupport.speechRecognition ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                </div>
                <div className={styles.status}>
                    <span className={styles.label}>Web Audio API:</span>
                    <span className={diagnostics.browserSupport.webAudio ? styles.success : styles.error}>
                        {diagnostics.browserSupport.webAudio ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                </div>
            </div>

            <div className={styles.section}>
                <h4>Recommended Browser</h4>
                <p>For best experience, use <strong>Chrome</strong> or <strong>Edge</strong></p>
            </div>
        </div>
    );
};

export default FocuslyDiagnostics;
