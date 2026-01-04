import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Volume2, VolumeX } from 'lucide-react';
import FocuslyMessage from './FocuslyMessage';
import FocuslyTypingIndicator from './FocuslyTypingIndicator';
import FocuslyInputBar from './FocuslyInputBar';
import styles from './FocuslyChatInterface.module.css';

/**
 * Main Chat Interface Component
 * Displays messages, typing indicator, suggestions, and input
 */
const FocuslyChatInterface = ({
    messages = [],
    isTyping = false,
    streamingText = '',
    suggestions = [],
    onSendMessage,
    onSuggestionClick,
    onClose,
    onVoiceStart,
    onVoiceStop,
    isListening = false,
    isVoiceSupported = true,
    voiceEnabled = true,
    onVoiceToggle,
    onSettingsClick,
    isSpeaking = false
}) => {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }
    }, [messages, isTyping, streamingText]);

    return (
        <div className={styles.chatInterface}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.title}>
                        <span className={styles.lionEmoji}>🦁</span>
                        <span>Focusly AI</span>
                    </div>
                    <div className={styles.status}>
                        {isSpeaking ? (
                            <span className={styles.speaking}>Speaking...</span>
                        ) : isListening ? (
                            <span className={styles.listening}>Listening...</span>
                        ) : isTyping ? (
                            <span className={styles.typing}>Typing...</span>
                        ) : (
                            <span className={styles.online}>Online</span>
                        )}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    {/* Voice Toggle */}
                    <motion.button
                        className={styles.headerButton}
                        onClick={onVoiceToggle}
                        whileTap={{ scale: 0.95 }}
                        title={voiceEnabled ? "Disable voice" : "Enable voice"}
                    >
                        {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </motion.button>

                    {/* Settings */}
                    <motion.button
                        className={styles.headerButton}
                        onClick={onSettingsClick}
                        whileTap={{ scale: 0.95 }}
                        title="Settings"
                    >
                        <Settings size={18} />
                    </motion.button>

                    {/* Close */}
                    <motion.button
                        className={styles.closeButton}
                        onClick={onClose}
                        whileTap={{ scale: 0.95 }}
                        title="Close"
                    >
                        <X size={20} />
                    </motion.button>
                </div>
            </div>

            {/* Messages Container */}
            <div className={styles.messagesContainer} ref={messagesContainerRef}>
                <div className={styles.messagesList}>
                    {/* Messages */}
                    <AnimatePresence>
                        {messages.map((msg, index) => (
                            <FocuslyMessage
                                key={msg.id || index}
                                message={msg.text}
                                sender={msg.sender}
                                timestamp={msg.timestamp}
                                showAvatar={msg.sender === 'focusly'}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Streaming Message */}
                    {streamingText && (
                        <FocuslyMessage
                            message={streamingText}
                            sender="focusly"
                            isStreaming={true}
                            showAvatar={true}
                        />
                    )}

                    {/* Typing Indicator */}
                    <AnimatePresence>
                        {isTyping && !streamingText && (
                            <FocuslyTypingIndicator show={true} />
                        )}
                    </AnimatePresence>

                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Suggestions */}
            <AnimatePresence>
                {suggestions.length > 0 && messages.length === 0 && (
                    <motion.div
                        className={styles.suggestionsContainer}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <div className={styles.suggestionsLabel}>Try asking:</div>
                        <div className={styles.suggestionsList}>
                            {suggestions.map((suggestion, index) => (
                                <motion.button
                                    key={index}
                                    className={styles.suggestionChip}
                                    onClick={() => onSuggestionClick(suggestion)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    {suggestion}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className={styles.inputContainer}>
                <FocuslyInputBar
                    onSendMessage={onSendMessage}
                    onVoiceStart={onVoiceStart}
                    onVoiceStop={onVoiceStop}
                    isListening={isListening}
                    isVoiceSupported={isVoiceSupported}
                    disabled={isTyping}
                />
            </div>
        </div>
    );
};

export default FocuslyChatInterface;
