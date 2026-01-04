/**
 * FocuslyChatModal Component
 * 
 * Modal interface for chatting with Focusly AI assistant
 * 
 * Features:
 * - Full-screen modal on mobile, side panel on desktop
 * - Chat history
 * - Message input with send button
 * - AI response streaming
 * - Typing indicators
 * - Quick action buttons
 * - Context-aware responses
 * - Integration with Focusly AI service
 * 
 * @component
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { initializeFocuslyWithReference } from '../../services/focuslyAI';
import './FocuslyChatModal.css';

const FocuslyChatModal = ({ user, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hi! I\'m Focusly, your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [focuslyAI, setFocuslyAI] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Focusly AI
  useEffect(() => {
    const initAI = async () => {
      try {
        const ai = await initializeFocuslyWithReference();
        setFocuslyAI(ai);
      } catch (error) {
        console.error('Failed to initialize Focusly AI:', error);
      }
    };
    initAI();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate AI response (replace with actual Focusly AI call)
      setTimeout(() => {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: getAIResponse(inputValue),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsTyping(false);
    }
  };

  const getAIResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Context-aware responses
    if (lowerQuery.includes('create') || lowerQuery.includes('post')) {
      return 'To create a post, click the + button in the bottom navigation. You can choose between Post, Boltz, or Flash!';
    }
    if (lowerQuery.includes('explore') || lowerQuery.includes('discover')) {
      return 'Check out the Explore page to discover trending content, hashtags, and new creators!';
    }
    if (lowerQuery.includes('message') || lowerQuery.includes('chat')) {
      return 'Go to Messages to chat with your friends. You can send text, photos, videos, and voice messages!';
    }
    if (lowerQuery.includes('profile') || lowerQuery.includes('edit')) {
      return 'Tap your profile picture in the top right to view and edit your profile.';
    }
    if (lowerQuery.includes('settings')) {
      return 'Go to Settings to customize your experience, manage privacy, and more.';
    }
    if (lowerQuery.includes('boltz')) {
      return 'Boltz is our short-form video feature! Swipe up and down to watch entertaining videos.';
    }
    if (lowerQuery.includes('flash') || lowerQuery.includes('story') || lowerQuery.includes('stories')) {
      return 'Flash stories disappear after 24 hours. Share quick moments with your followers!';
    }
    
    return 'I\'m here to help! You can ask me about creating posts, exploring content, messaging friends, or any other feature of Focus.';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Create Post', icon: '📸' },
    { label: 'Explore', icon: '🔍' },
    { label: 'Messages', icon: '💬' },
    { label: 'Help', icon: '❓' }
  ];

  const handleQuickAction = (action) => {
    setInputValue(action.label);
    handleSend();
  };

  return (
    <motion.div
      className="focusly-chat-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="focusly-chat-modal"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="focusly-chat-header">
          <div className="focusly-chat-header-content">
            <div className="focusly-avatar">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="focusly-header-info">
              <h3>Focusly AI</h3>
              <span className="focusly-status">
                <span className="status-dot"></span>
                Online
              </span>
            </div>
          </div>
          <button
            className="focusly-close-btn"
            onClick={onClose}
            aria-label="Close chat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="focusly-quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action)}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="focusly-chat-messages">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`chat-message ${message.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {message.role === 'assistant' && (
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}
              <div className="message-content">
                <p>{message.content}</p>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              className="chat-message assistant typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="focusly-chat-input-container">
          <div className="focusly-chat-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Focusly anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label="Send message"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FocuslyChatModal;
