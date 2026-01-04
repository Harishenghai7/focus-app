import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import FocuslyButton from './FocuslyButton';
import FocuslyAvatarLottie from './FocuslyAvatarLottie';
import FocuslyChatInterface from './FocuslyChatInterface';
import useFocuslyAI from '../../hooks/useFocuslyAI';
import useFocuslyVoice from '../../hooks/useFocuslyVoice';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import useFocuslyMemory from '../../hooks/useFocuslyMemory';
import useFocuslySettings from '../../hooks/useFocuslySettings';
import { detectEmotion, getAvatarExpression } from '../../utils/emotionDetector';
import soundLibrary from '../../utils/soundLibrary';
import styles from './FocuslyWidget.module.css';

/**
 * Main Focusly AI Widget
 * Production-ready virtual companion with all features integrated
 */
const FocuslyWidget = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [currentEmotion, setCurrentEmotion] = useState('idle');
    const [showParticles, setShowParticles] = useState(false);
    const [particleType, setParticleType] = useState('celebration');
    const [currentViseme, setCurrentViseme] = useState('neutral');

    // Get current page
    const currentPage = location.pathname.split('/')[1] || 'home';

    // Hooks
    const {
        messages,
        isTyping,
        streamingText,
        suggestions,
        sendMessage,
        getGreeting
    } = useFocuslyAI(currentPage);

    const {
        isSpeaking,
        settings: voiceSettings,
        speak,
        stop: stopSpeaking
    } = useFocuslyVoice();

    const {
        isListening,
        transcript,
        isSupported: isVoiceSupported,
        startListening,
        stopListening,
        resetTranscript
    } = useSpeechRecognition();

    const {
        addMessage,
        getPersonalizedGreeting,
        trackMood
    } = useFocuslyMemory();

    const {
        settings,
        toggleVoice,
        toggleSound
    } = useFocuslySettings();

    // Initialize sound library
    useEffect(() => {
        soundLibrary.init();
        soundLibrary.setEnabled(settings.sound.enabled);
        soundLibrary.setVolume(settings.sound.volume);
    }, [settings.sound.enabled, settings.sound.volume]);

    // Handle voice transcript
    useEffect(() => {
        if (transcript && !isListening) {
            handleSendMessage(transcript);
            resetTranscript();
        }
    }, [transcript, isListening]);

    // Keyboard shortcut (Ctrl+Shift+F)
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                toggleWidget();
            }
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen]);

    /**
     * Toggle widget open/close
     */
    const toggleWidget = () => {
        if (isOpen) {
            handleClose();
        } else {
            handleOpen();
        }
    };

    /**
     * Open widget
     */
    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setIsMinimized(false);
        soundLibrary.playEventSound('open');

        // Send greeting if no messages
        if (messages.length === 0) {
            const greeting = getPersonalizedGreeting();
            setTimeout(() => {
                const msg = addMessage(greeting, 'focusly');
                if (settings.voice.enabled) {
                    speak(greeting);
                }
            }, 500);
        }
    }, [messages, getPersonalizedGreeting, addMessage, settings.voice.enabled, speak]);

    /**
     * Close widget
     */
    const handleClose = useCallback(() => {
        setIsOpen(false);
        setIsMinimized(true);
        soundLibrary.playEventSound('close');
        stopSpeaking();
        if (isListening) {
            stopListening();
        }
    }, [stopSpeaking, isListening, stopListening]);

    /**
     * Send message handler
     */
    const handleSendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        // Add user message
        addMessage(text, 'user');
        soundLibrary.playEventSound('message');

        // Detect emotion
        const emotionAnalysis = detectEmotion(text);
        const avatarEmotion = getAvatarExpression(emotionAnalysis.emotion);

        // Update avatar emotion
        setCurrentEmotion(avatarEmotion);
        trackMood(emotionAnalysis.emotion, emotionAnalysis.intensity);

        // Show particles for celebrations
        if (emotionAnalysis.emotion === 'celebrating') {
            setParticleType('celebration');
            setShowParticles(true);
            setTimeout(() => setShowParticles(false), 2000);
        }

        // Send to AI and get response
        const response = await sendMessage(text, { streaming: true });

        // Add AI response
        if (response) {
            addMessage(response, 'focusly');

            // Speak response if voice enabled
            if (settings.voice.enabled) {
                await speak(response);
            }
        }

        // Reset emotion after delay
        setTimeout(() => setCurrentEmotion('idle'), 3000);
    }, [addMessage, sendMessage, trackMood, settings.voice.enabled, speak]);

    /**
     * Handle suggestion click
     */
    const handleSuggestionClick = useCallback((suggestion) => {
        handleSendMessage(suggestion);
    }, [handleSendMessage]);

    /**
     * Handle voice start
     */
    const handleVoiceStart = useCallback(() => {
        if (!isVoiceSupported) {
            console.warn('Speech recognition not supported');
            return;
        }

        setCurrentEmotion('listening');
        soundLibrary.playEventSound('click');
        startListening();
    }, [isVoiceSupported, startListening]);

    /**
     * Handle voice stop
     */
    const handleVoiceStop = useCallback(() => {
        stopListening();
        setCurrentEmotion('idle');
    }, [stopListening]);

    /**
     * Handle settings click
     */
    const handleSettingsClick = useCallback(() => {
        // TODO: Implement settings modal
        console.log('Settings clicked');
    }, []);

    return (
        <>
            {/* Floating Button (minimized) */}
            <AnimatePresence>
                {isMinimized && (
                    <FocuslyButton
                        onClick={handleOpen}
                        notificationCount={0}
                    />
                )}
            </AnimatePresence>

            {/* Chat Widget (expanded) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.widget}
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                    >
                        {/* Avatar Section */}
                        <div className={styles.avatarSection}>
                            <FocuslyAvatarLottie
                                emotion={currentEmotion}
                                isSpeaking={isSpeaking}
                                currentViseme={currentViseme}
                                size={settings.ui.size}
                                showParticles={showParticles}
                                particleType={particleType}
                            />
                        </div>

                        {/* Chat Interface */}
                        <FocuslyChatInterface
                            messages={messages}
                            isTyping={isTyping}
                            streamingText={streamingText}
                            suggestions={suggestions}
                            onSendMessage={handleSendMessage}
                            onSuggestionClick={handleSuggestionClick}
                            onClose={handleClose}
                            onVoiceStart={handleVoiceStart}
                            onVoiceStop={handleVoiceStop}
                            isListening={isListening}
                            isVoiceSupported={isVoiceSupported}
                            voiceEnabled={settings.voice.enabled}
                            onVoiceToggle={toggleVoice}
                            onSettingsClick={handleSettingsClick}
                            isSpeaking={isSpeaking}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FocuslyWidget;
