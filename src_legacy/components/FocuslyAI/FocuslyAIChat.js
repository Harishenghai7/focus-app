import React, { useState, useEffect, useRef } from 'react';
import { FOCUSLY_STICKERS, getStickerUrl } from '../../data/focuslyStickerData';
import './FocuslyAIChat.css';

/**
 * Focusly AI Chat Component with Sticker Support
 * Focusly AI responds with contextual stickers based on emotion
 */

const FocuslyAIChat = ({ currentUser, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focuslyTyping, setFocuslyTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Map emotions to sticker IDs
  const emotionToStickerMap = {
    happy: 1,        // Happy
    excited: 11,     // Excited
    sad: 3,          // Sad
    love: 5,         // Love
    thinking: 7,     // Thinking
    cool: 6,         // Cool
    laughing: 2,     // Laughing
    mind_blown: 14,  // Mind Blown
    fire: 33,        // Fire
    celebrate: 35    // Celebrate
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Get appropriate sticker based on emotion
   */
  const getFocuslySticker = (emotion = 'happy') => {
    const stickerId = emotionToStickerMap[emotion] || 1;
    return FOCUSLY_STICKERS.find(s => s.id === stickerId);
  };

  /**
   * Detect emotion from text using keywords
   */
  const detectEmotion = (text) => {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('love') ||
      lowerText.includes('adore') ||
      lowerText.includes('heart') ||
      lowerText.includes('thank')
    ) {
      return 'love';
    }

    if (
      lowerText.includes('happy') ||
      lowerText.includes('great') ||
      lowerText.includes('awesome') ||
      lowerText.includes('great')
    ) {
      return 'happy';
    }

    if (
      lowerText.includes('excited') ||
      lowerText.includes('amazing') ||
      lowerText.includes('wow') ||
      lowerText.includes('yay')
    ) {
      return 'excited';
    }

    if (
      lowerText.includes('sad') ||
      lowerText.includes('down') ||
      lowerText.includes('bad') ||
      lowerText.includes('unhappy')
    ) {
      return 'sad';
    }

    if (
      lowerText.includes('think') ||
      lowerText.includes('wonder') ||
      lowerText.includes('hmm') ||
      lowerText.includes('curious')
    ) {
      return 'thinking';
    }

    if (
      lowerText.includes('cool') ||
      lowerText.includes('chill') ||
      lowerText.includes('relax')
    ) {
      return 'cool';
    }

    if (
      lowerText.includes('laugh') ||
      lowerText.includes('funny') ||
      lowerText.includes('lol')
    ) {
      return 'laughing';
    }

    if (
      lowerText.includes('celebrate') ||
      lowerText.includes('party') ||
      lowerText.includes('success')
    ) {
      return 'celebrate';
    }

    return 'happy'; // default
  };

  /**
   * Simulate Focusly AI response
   */
  const generateFocuslyResponse = (userMessage) => {
    const responses = {
      greeting: [
        "Hey there! 🦁 Great to see you! How can I help you focus today?",
        "Hello! I'm Focusly, your AI focus buddy! What's on your mind?",
        "Hi! Ready to crush your goals? Let's chat! 🎯"
      ],
      focus_help: [
        "I'm here to help you stay focused! Try breaking your tasks into smaller chunks.",
        "To maintain focus, eliminate distractions and take regular breaks. You've got this!",
        "Focus is all about consistency. Start with your most important task first!"
      ],
      motivation: [
        "You're doing amazing! Keep pushing yourself - you're closer than you think.",
        "Remember: progress over perfection. Every step counts!",
        "I believe in you! Let's make today productive together."
      ],
      reflection: [
        "That sounds thoughtful. Take a moment to reflect on what matters most to you.",
        "I hear you. Sometimes the best solutions come from deeper thinking.",
        "Great perspective! How can I support you further?"
      ]
    };

    const lowerInput = userMessage.toLowerCase();

    if (
      lowerInput.includes('hi') ||
      lowerInput.includes('hello') ||
      lowerInput.includes('hey')
    ) {
      return responses.greeting[
        Math.floor(Math.random() * responses.greeting.length)
      ];
    }

    if (
      lowerInput.includes('focus') ||
      lowerInput.includes('concentrate') ||
      lowerInput.includes('distract')
    ) {
      return responses.focus_help[
        Math.floor(Math.random() * responses.focus_help.length)
      ];
    }

    if (
      lowerInput.includes('motivat') ||
      lowerInput.includes('inspire') ||
      lowerInput.includes('encourage')
    ) {
      return responses.motivation[
        Math.floor(Math.random() * responses.motivation.length)
      ];
    }

    return responses.reflection[
      Math.floor(Math.random() * responses.reflection.length)
    ];
  };

  /**
   * Handle sending message to Focusly
   */
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    try {
      setLoading(true);

      // Add user message
      const userMessage = {
        id: Date.now(),
        sender: 'user',
        text: userInput.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setUserInput('');

      // Simulate typing delay
      setFocuslyTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate response
      const responseText = generateFocuslyResponse(userInput);
      const emotion = detectEmotion(responseText);
      const sticker = getFocuslySticker(emotion);

      const focuslyMessage = {
        id: Date.now() + 1,
        sender: 'focusly',
        text: responseText,
        emotion,
        sticker,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, focuslyMessage]);
      setFocuslyTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setFocuslyTyping(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle keyboard shortcut
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="focusly-chat-overlay" onClick={onClose}>
      <div className="focusly-chat-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="focusly-chat-header">
          <div className="focusly-header-content">
            <div className="focusly-logo">🦁</div>
            <div>
              <h2 className="focusly-title">Focusly AI</h2>
              <p className="focusly-status">Always here to help</p>
            </div>
          </div>
          <button
            className="focusly-close-button"
            onClick={onClose}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="focusly-messages">
          {messages.length === 0 ? (
            <div className="focusly-welcome">
              <div className="welcome-sticker">🦁</div>
              <h3 className="welcome-title">Welcome to Focusly!</h3>
              <p className="welcome-text">
                I'm your AI companion here to help you stay focused and motivated.
                Tell me what's on your mind!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`focusly-message ${message.sender}`}
              >
                {message.sender === 'focusly' && (
                  <div className="focusly-message-avatar">🦁</div>
                )}

                <div className="focusly-message-content">
                  <p className="focusly-message-text">{message.text}</p>

                  {message.sticker && message.sender === 'focusly' && (
                    <div className="focusly-sticker-response">
                      <img
                        src={getStickerUrl(message.sticker.fileName)}
                        alt={message.sticker.name}
                        className="focusly-sticker-image"
                        title={message.sticker.name}
                      />
                    </div>
                  )}

                  <span className="focusly-message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}

          {focuslyTyping && (
            <div className="focusly-message focusly">
              <div className="focusly-message-avatar">🦁</div>
              <div className="focusly-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="focusly-input-area">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell Focusly what's on your mind..."
            className="focusly-input"
            disabled={loading}
            rows="1"
          />
          <button
            className="focusly-send-button"
            onClick={handleSendMessage}
            disabled={loading || !userInput.trim() || focuslyTyping}
            title="Send message"
          >
            {loading ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocuslyAIChat;
