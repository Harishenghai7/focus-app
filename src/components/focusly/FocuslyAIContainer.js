import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Draggable from '../shared/Draggable';
import FocuslyButton from './FocuslyButton';
import FocuslyAvatar from './FocuslyAvatar';
import FocuslyChatOverlay from './FocuslyChatOverlay';
import useFocuslyAI from '../../hooks/useFocuslyAI';
import useFocuslyVoice from '../../hooks/useFocuslyVoice';
import useLipSync from '../../hooks/useLipSync';
import useAvatarAnimation from '../../hooks/useAvatarAnimation';
import useFocuslyEmotion from '../../hooks/useFocuslyEmotion';
import { trackInteraction, isFirstVisit, getOnboardingStatus } from '../../utils/focuslyContextMemory';
import soundReactions from '../../utils/soundReactions';
import styles from './FocuslyAIContainer.module.css';

/**
 * Main Focusly AI Container
 * Manages the entire Focusly companion experience
 */
const FocuslyAIContainer = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);

    // Get current page name from location
    const currentPage = location.pathname.split('/')[1] || 'home';

    // Hooks
    const {
        messages,
        isTyping,
        streamingText,
        suggestions,
        sendMessage,
        sendSuggestion,
        getGreeting,
        getContextualTip,
        updateContext
    } = useFocuslyAI(currentPage);

    const {
        isSpeaking,
        settings: voiceSettings,
        speak,
        stop: stopSpeaking,
        toggleEnabled: toggleVoice,
        setCallbacks: setVoiceCallbacks
    } = useFocuslyVoice();

    const {
        currentAnimation,
        currentExpression,
        isBlinking,
        greet,
        reactToEmotion,
        setExpression
    } = useAvatarAnimation();

    const {
        currentViseme,
        handleBoundary,
        reset: resetLipSync
    } = useLipSync(streamingText || '', isSpeaking, voiceSettings.rate);

    const {
        detectEmotion,
        getAvatarExpression,
        getEmpatheticPrefix,
        needsSupport,
        getSupportiveMessage
    } = useFocuslyEmotion();

    // Setup voice callbacks for lip sync
    useEffect(() => {
        setVoiceCallbacks({
            onStart: () => {
                soundReactions.playEventSound('open');
            },
            onBoundary: handleBoundary,
            onEnd: () => {
                resetLipSync();
            }
        });
    }, [setVoiceCallbacks, handleBoundary, resetLipSync]);

    // Greeting on first visit or page change
    useEffect(() => {
        const firstVisit = isFirstVisit();
        const onboarding = getOnboardingStatus();

        if (firstVisit && !onboarding.completed) {
            // Show proactive greeting for first-time users
            setTimeout(() => {
                setNotificationCount(1);
                greet();
                soundReactions.playNotification();
            }, 2000);
        }
    }, [greet]);

    // Update context when user mood changes
    useEffect(() => {
        if (needsSupport()) {
            updateContext({ needsSupport: true });
            setNotificationCount(prev => prev + 1);
        }
    }, [needsSupport, updateContext]);

    /**
     * Handle opening chat
     */
    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setIsMinimized(false);
        setNotificationCount(0);
        trackInteraction('chat_opened');
        soundReactions.playEventSound('open');
        greet();

        // Send greeting if no messages
        if (messages.length === 0) {
            const greeting = getGreeting();
            setTimeout(() => {
                sendMessage(greeting);
            }, 500);
        }
    }, [messages, getGreeting, sendMessage, greet]);

    /**
     * Handle closing chat
     */
    const handleClose = useCallback(() => {
        setIsOpen(false);
        setIsMinimized(true);
        soundReactions.playEventSound('close');
        stopSpeaking();
    }, [stopSpeaking]);

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
            // Add empathetic prefix if needed
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
     * Handle keyboard shortcut (Ctrl+Shift+F)
     */
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                if (isOpen) {
                    handleClose();
                } else {
                    handleOpen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, handleOpen, handleClose]);

    return (
        <>
            {/* Floating Button (when minimized) */}
            {isMinimized && (
                <FocuslyButton
                    onClick={handleOpen}
                    notificationCount={notificationCount}
                />
            )}

            {/* Chat Interface (when open) */}
            {isOpen && (
                <Draggable
                    savePosition={true}
                    storageKey="focusly_chat_position"
                    className={styles.draggableContainer}
                >
                    <div className={styles.container}>
                        {/* Avatar */}
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
                </Draggable>
            )}
        </>
    );
};

export default FocuslyAIContainer;
