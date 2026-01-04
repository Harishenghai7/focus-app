import React, { useState, useRef, useEffect } from 'react';
import styles from './FocuslyChatOverlay.module.css';
import { Mic, Send, X, Volume2, VolumeX } from 'lucide-react';
import sttEngine from '../../utils/sttEngine';

/**
 * Focusly Chat Overlay Component
 * Chat interface with message history, text/voice input, and typing indicator
 */
const FocuslyChatOverlay = ({
    messages = [],
    isTyping = false,
    streamingText = '',
    suggestions = [],
    onSendMessage,
    onSuggestionClick,
    onClose,
    voiceEnabled = true,
    onVoiceToggle,
    isSpeaking = false
}) => {
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText]);

    /**
     * Handle send message
     */
    const handleSend = () => {
        if (inputText.trim() && onSendMessage) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    /**
     * Handle key press
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /**
     * Handle voice input
     */
    const handleVoiceInput = async () => {
        if (!sttEngine.isSupported) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            sttEngine.stop();
            setIsListening(false);
            setInterimTranscript('');
            return;
        }

        try {
            setIsListening(true);

            // Setup callbacks
            sttEngine.setCallbacks({
                onInterim: (interim) => {
                    setInterimTranscript(interim);
                },
                onResult: (final) => {
                    setInputText(final);
                    setInterimTranscript('');
                },
                onEnd: () => {
                    setIsListening(false);
                    setInterimTranscript('');
                },
                onError: (error) => {
                    console.error('Speech recognition error:', error);
                    setIsListening(false);
                    setInterimTranscript('');
                }
            });

            // Start listening
            await sttEngine.start();
        } catch (error) {
            console.error('Failed to start voice input:', error);
            setIsListening(false);
        }
    };

    /**
     * Format timestamp
     */
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.chatOverlay}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h3>Focusly AI</h3>
                    <span className={styles.status}>
                        {isTyping ? 'Typing...' : isSpeaking ? 'Speaking...' : 'Online'}
                    </span>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.iconButton}
                        onClick={onVoiceToggle}
                        aria-label={voiceEnabled ? 'Mute voice' : 'Unmute voice'}
                    >
                        {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button
                        className={styles.iconButton}
                        onClick={onClose}
                        aria-label="Close chat"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.aiMessage
                            }`}
                    >
                        <div className={styles.messageContent}>
                            {message.content}
                        </div>
                        <div className={styles.messageTime}>
                            {formatTime(message.timestamp)}
                        </div>
                    </div>
                ))}

                {/* Streaming message */}
                {streamingText && (
                    <div className={`${styles.message} ${styles.aiMessage}`}>
                        <div className={styles.messageContent}>
                            {streamingText}
                            <span className={styles.cursor}>|</span>
                        </div>
                    </div>
                )}

                {/* Typing indicator */}
                {isTyping && !streamingText && (
                    <div className={`${styles.message} ${styles.aiMessage}`}>
                        <div className={styles.typingIndicator}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && messages.length === 0 && (
                <div className={styles.suggestions}>
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className={styles.suggestionChip}
                            onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className={styles.inputContainer}>
                {interimTranscript && (
                    <div className={styles.interimTranscript}>
                        {interimTranscript}
                    </div>
                )}
                <div className={styles.inputWrapper}>
                    <textarea
                        ref={inputRef}
                        className={styles.input}
                        placeholder="Ask Focusly anything..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={1}
                        disabled={isListening}
                    />
                    <div className={styles.inputActions}>
                        <button
                            className={`${styles.iconButton} ${isListening ? styles.listening : ''}`}
                            onClick={handleVoiceInput}
                            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                        >
                            <Mic size={20} />
                        </button>
                        <button
                            className={styles.sendButton}
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            aria-label="Send message"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocuslyChatOverlay;
