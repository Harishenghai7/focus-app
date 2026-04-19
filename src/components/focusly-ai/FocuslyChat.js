import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './FocuslyChat.module.css';
import Modal from '../ui/Modal';
import FocuslyAvatar from './FocuslyAvatar';
import FocuslyChatOverlay from './FocuslyChatOverlay';
import useFocuslyAI from '../../hooks/useFocuslyAI';
import useFocuslyVoice from '../../hooks/useFocuslyVoice';
import useFocuslyEmotion from '../../hooks/useFocuslyEmotion';
import useAvatarAnimation from '../../hooks/useAvatarAnimation';
import { trackInteraction } from '../../utils/focuslyContextMemory';
import soundReactions from '../../utils/soundReactions';

/**
 * FocuslyChat Component
 * Real-time AI chat interface with animated avatar and voice synthesis
 */
const FocuslyChat = ({ isOpen, onClose }) => {
    const location = useLocation();
    const currentPage = location.pathname.split('/')[1] || 'home';

    // AI Chat State
    const {
        messages,
        isTyping,
        streamingText,
        suggestions,
        sendMessage,
        sendSuggestion,
        getGreeting
    } = useFocuslyAI(currentPage);

    // Voice Synthesis
    const {
        isSpeaking,
        settings: voiceSettings,
        speak,
        stop: stopSpeaking,
        toggleEnabled: toggleVoice
    } = useFocuslyVoice();

    // Emotion Detection
    const {
        detectEmotion,
        getAvatarExpression,
        getEmpatheticPrefix
    } = useFocuslyEmotion();

    // Avatar Animation
    const {
        currentAnimation,
        currentExpression,
        setExpression,
        reactToEmotion
    } = useAvatarAnimation();

    // Send greeting on first open
    React.useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = getGreeting();
            setTimeout(() => {
                sendMessage(greeting);
            }, 500);
        }
    }, [isOpen, messages.length, getGreeting, sendMessage]);

    /**
     * Handle sending message
     */
    const handleSendMessage = useCallback(async (text) => {
        trackInteraction('messages');
        soundReactions.playEventSound('click');

        // Detect emotion
        const emotion = detectEmotion(text);
        const avatarExpr = getAvatarExpression(emotion.emotion);
        setExpression(avatarExpr, 3000);

        // Send message and get response
        const response = await sendMessage(text, { streaming: true });

        // Speak the response
        if (voiceSettings.enabled && response) {
            const prefix = getEmpatheticPrefix(emotion.emotion);
            const fullResponse = prefix + response;
            await speak(fullResponse);
        }

        // React to emotion
        if (emotion.confidence > 0.5) {
            reactToEmotion(emotion.emotion);
            soundReactions.playEmotionReaction(emotion.emotion);
        }
    }, [
        detectEmotion,
        getAvatarExpression,
        setExpression,
        sendMessage,
        voiceSettings.enabled,
        speak,
        getEmpatheticPrefix,
        reactToEmotion
    ]);

    /**
     * Handle suggestion click
     */
    const handleSuggestionClick = useCallback(async (suggestion) => {
        await handleSendMessage(suggestion);
    }, [handleSendMessage]);

    /**
     * Handle close
     */
    const handleClose = useCallback(() => {
        stopSpeaking();
        soundReactions.playEventSound('close');
        onClose();
    }, [stopSpeaking, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className={styles.container}>
                {/* Avatar Section */}
                <div className={styles.avatarSection}>
                    <FocuslyAvatar
                        emotion={currentAnimation !== 'idle' ? currentAnimation : currentExpression}
                        isSpeaking={isSpeaking}
                        size="large"
                    />
                </div>

                {/* Chat Overlay */}
                <FocuslyChatOverlay
                    messages={messages}
                    isTyping={isTyping}
                    streamingText={streamingText}
                    suggestions={suggestions}
                    onSendMessage={handleSendMessage}
                    onSuggestionClick={handleSuggestionClick}
                    onClose={handleClose}
                    voiceEnabled={voiceSettings.enabled}
                    onVoiceToggle={toggleVoice}
                    isSpeaking={isSpeaking}
                />
            </div>
        </Modal>
    );
};

export default FocuslyChat;
