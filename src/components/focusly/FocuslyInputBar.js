import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send } from 'lucide-react';
import styles from './FocuslyInputBar.module.css';

/**
 * Input Bar Component
 * Text input with voice button and send functionality
 */
const FocuslyInputBar = ({
    onSendMessage,
    onVoiceStart,
    onVoiceStop,
    isListening = false,
    isVoiceSupported = true,
    disabled = false,
    placeholder = "Ask me anything..."
}) => {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Auto-focus input
    useEffect(() => {
        if (inputRef.current && !disabled) {
            inputRef.current.focus();
        }
    }, [disabled]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const toggleVoice = () => {
        if (isListening) {
            onVoiceStop?.();
        } else {
            onVoiceStart?.();
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.inputBar}>
            <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''} ${isListening ? styles.listening : ''}`}>
                {/* Voice Button */}
                {isVoiceSupported && (
                    <motion.button
                        type="button"
                        className={`${styles.voiceButton} ${isListening ? styles.active : ''}`}
                        onClick={toggleVoice}
                        disabled={disabled}
                        whileTap={{ scale: 0.95 }}
                        title={isListening ? "Stop listening" : "Voice input"}
                    >
                        <AnimatePresence mode="wait">
                            {isListening ? (
                                <motion.div
                                    key="mic-on"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Mic className={styles.icon} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="mic-off"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <MicOff className={styles.icon} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Listening animation */}
                        {isListening && (
                            <motion.div
                                className={styles.listeningRing}
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 0, 0.5]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        )}
                    </motion.button>
                )}

                {/* Text Input */}
                <textarea
                    ref={inputRef}
                    className={styles.input}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isListening ? "Listening..." : placeholder}
                    disabled={disabled || isListening}
                    rows={1}
                    maxLength={1000}
                />

                {/* Send Button */}
                <motion.button
                    type="submit"
                    className={styles.sendButton}
                    disabled={!message.trim() || disabled}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: message.trim() ? 1.05 : 1 }}
                    title="Send message"
                >
                    <Send className={styles.icon} />
                </motion.button>
            </div>

            {/* Character count (optional) */}
            {message.length > 800 && (
                <div className={styles.characterCount}>
                    {message.length}/1000
                </div>
            )}
        </form>
    );
};

export default FocuslyInputBar;
