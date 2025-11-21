import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import FocuslyAvatar from '../components/FocuslyAI/FocuslyAvatar';
import geminiAI from '../services/geminiAI';
import './Focusly.css';

const Focusly = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Initial greeting
    const greeting = {
      id: Date.now(),
      sender: 'focusly',
      text: `Hello ${user?.username || 'friend'}! 👋 I'm Focusly, your AI focus buddy! What's on your mind?`,
      timestamp: new Date(),
      emotion: 'happy'
    };
    setMessages([greeting]);
    
    if (voiceEnabled) {
      speakMessage(greeting.text, 'happy');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakMessage = async (text, emotion) => {
    setIsSpeaking(true);
    setCurrentEmotion(emotion);
    
    await geminiAI.speakResponse(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setCurrentEmotion('neutral');
      }
    });
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await geminiAI.getResponse(inputText, {
        user: user,
        page: 'focusly-chat',
        previousMessages: messages.slice(-3)
      });

      setTimeout(() => {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'focusly',
          text: response.text,
          timestamp: new Date(),
          emotion: response.emotion
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);

        if (voiceEnabled && response.shouldSpeak) {
          speakMessage(response.text, response.emotion);
        } else {
          setCurrentEmotion(response.emotion);
          setTimeout(() => setCurrentEmotion('neutral'), 3000);
        }
      }, 1000);

    } catch (error) {
      console.error('Error getting response:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'focusly',
        text: "Oops! I had a small hiccup. Can you try asking again? 🦊",
        timestamp: new Date(),
        emotion: 'concerned'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      geminiAI.speakResponse('', { onEnd: () => setIsSpeaking(false) });
    }
  };

  return (
    <div className="focusly-page">
      {/* Header with Animated Avatar */}
      <div className="focusly-header">
        <div className="header-content">
          <FocuslyAvatar 
            isActive={true}
            isSpeaking={isSpeaking}
            emotion={currentEmotion}
            size="large"
          />
          <div className="header-info">
            <h1 className="header-title">Focusly AI</h1>
            <p className="header-status">
              {isSpeaking ? (
                <>🎤 Speaking...</>
              ) : isTyping ? (
                <>✍️ Typing...</>
              ) : (
                <>💬 Always here to help</>
              )}
            </p>
          </div>
          <button 
            className={`voice-toggle-btn ${voiceEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleVoice}
            title={voiceEnabled ? 'Voice On' : 'Voice Off'}
          >
            {voiceEnabled ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="focusly-messages">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`message-wrapper ${message.sender === 'user' ? 'user' : 'focusly'}`}
          >
            {message.sender === 'focusly' && (
              <div className="message-avatar">
                🦊
              </div>
            )}
            <div className="message-bubble">
              <p className="message-text">{message.text}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            {message.sender === 'user' && (
              <div className="message-avatar user-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" />
                ) : (
                  '👤'
                )}
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="message-wrapper focusly">
            <div className="message-avatar">🦊</div>
            <div className="message-bubble typing-bubble">
              <div className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="quick-action-btn"
          onClick={() => setInputText('Help me create a post')}
          disabled={isTyping || isSpeaking}
        >
          <span className="action-icon">📸</span>
          <span className="action-label">Create Post</span>
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => setInputText('Find friends for me')}
          disabled={isTyping || isSpeaking}
        >
          <span className="action-icon">👥</span>
          <span className="action-label">Find Friends</span>
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => setInputText('Edit my profile')}
          disabled={isTyping || isSpeaking}
        >
          <span className="action-icon">✏️</span>
          <span className="action-label">Edit Profile</span>
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => setInputText('What can you do?')}
          disabled={isTyping || isSpeaking}
        >
          <span className="action-icon">❓</span>
          <span className="action-label">Help</span>
        </button>
      </div>

      {/* Input Area */}
      <div className="focusly-input-area">
        <button className="attach-btn" disabled={isTyping || isSpeaking}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        
        <input
          ref={inputRef}
          type="text"
          className="message-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tell Focusly what's on your mind..."
          disabled={isTyping || isSpeaking}
        />
        
        <button 
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || isTyping || isSpeaking}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Focusly;
