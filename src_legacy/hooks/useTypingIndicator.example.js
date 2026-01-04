/**
 * useTypingIndicator Hook - Usage Examples
 * 
 * This file demonstrates how to use the useTypingIndicator hook
 * for real-time typing indicators in chat applications.
 */

import React, { useState, useEffect } from 'react';
import useTypingIndicator from './useTypingIndicator';

// ============================================================================
// Example 1: Basic Chat Input with Typing Indicator
// ============================================================================

export function ChatInputExample({ chatId, currentUser }) {
  const [message, setMessage] = useState('');
  const {
    setTyping,
    stopTyping,
    getTypingText,
    isAnyoneTyping,
    subscribeToChat,
    unsubscribeFromChat,
  } = useTypingIndicator(currentUser.id, currentUser.username);

  // Subscribe to chat on mount
  useEffect(() => {
    subscribeToChat(chatId);
    return () => unsubscribeFromChat(chatId);
  }, [chatId, subscribeToChat, unsubscribeFromChat]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Emit typing indicator when user types
    if (value.length > 0) {
      setTyping(chatId, true);
    } else {
      stopTyping(chatId);
    }
  };

  const handleSendMessage = () => {
    // Stop typing when message is sent
    stopTyping(chatId);
    // ... send message logic
    setMessage('');
  };

  return (
    <div className="chat-input-container">
      {/* Typing indicator display */}
      {isAnyoneTyping(chatId) && (
        <div className="typing-indicator">
          <span className="typing-text">{getTypingText(chatId)}</span>
          <span className="typing-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      )}

      {/* Chat input */}
      <div className="input-wrapper">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onBlur={() => stopTyping(chatId)}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 2: Multiple Chats with Separate Typing Indicators
// ============================================================================

export function MultiChatExample({ currentUser }) {
  const [activeChat, setActiveChat] = useState(null);
  const [chatList] = useState([
    { id: 'chat-1', name: 'Team Chat' },
    { id: 'chat-2', name: 'Project Discussion' },
    { id: 'chat-3', name: 'Direct Message' },
  ]);

  const {
    whoIsTyping,
    getTypingText,
    subscribeToChat,
    unsubscribeFromChat,
  } = useTypingIndicator(currentUser.id, currentUser.username);

  // Subscribe to all chats on mount
  useEffect(() => {
    chatList.forEach((chat) => subscribeToChat(chat.id));
    return () => {
      chatList.forEach((chat) => unsubscribeFromChat(chat.id));
    };
  }, [chatList, subscribeToChat, unsubscribeFromChat]);

  return (
    <div className="multi-chat-container">
      <div className="chat-list">
        {chatList.map((chat) => {
          const typing = whoIsTyping(chat.id);
          return (
            <div
              key={chat.id}
              className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChat(chat.id)}
            >
              <h4>{chat.name}</h4>
              {typing.length > 0 && (
                <p className="typing-preview">{getTypingText(chat.id)}</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="chat-window">
        {activeChat && <ChatView chatId={activeChat} currentUser={currentUser} />}
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Advanced Chat View with Custom Typing Display
// ============================================================================

export function AdvancedChatView({ chatId, currentUser }) {
  const [message, setMessage] = useState('');
  const {
    setTyping,
    stopTyping,
    whoIsTyping,
    typingUsers,
    subscribeToChat,
  } = useTypingIndicator(currentUser.id, currentUser.username);

  useEffect(() => {
    subscribeToChat(chatId);
  }, [chatId, subscribeToChat]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value) {
      setTyping(chatId, true);
    }
  };

  const typingUsernames = whoIsTyping(chatId);
  const chatTypingData = typingUsers[chatId] || [];

  return (
    <div className="advanced-chat">
      <div className="chat-messages">
        {/* Messages here */}
      </div>

      {/* Custom typing indicator with avatars */}
      {typingUsernames.length > 0 && (
        <div className="typing-indicator-custom">
          <div className="typing-avatars">
            {chatTypingData.slice(0, 3).map((user) => (
              <div key={user.userId} className="typing-avatar" title={user.username}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <div className="typing-text">
            {typingUsernames.length === 1 && `${typingUsernames[0]} is typing`}
            {typingUsernames.length === 2 &&
              `${typingUsernames[0]} and ${typingUsernames[1]} are typing`}
            {typingUsernames.length > 2 &&
              `${typingUsernames[0]} and ${typingUsernames.length - 1} others are typing`}
          </div>
          <div className="typing-animation">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        onBlur={() => stopTyping(chatId)}
        placeholder="Type a message..."
      />
    </div>
  );
}

// ============================================================================
// Example 4: Debounced Typing with Textarea
// ============================================================================

export function TextareaTypingExample({ chatId, currentUser }) {
  const [message, setMessage] = useState('');
  const { setTyping, stopTyping, getTypingText } = useTypingIndicator(
    currentUser.id,
    currentUser.username
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // setTyping automatically debounces and auto-clears
    if (value.trim()) {
      setTyping(chatId, true);
    } else {
      stopTyping(chatId);
    }
  };

  const handleKeyDown = (e) => {
    // Stop typing on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopTyping(chatId);
      // ... send message
      setMessage('');
    }
  };

  return (
    <div>
      <div className="typing-indicator">{getTypingText(chatId)}</div>
      <textarea
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => stopTyping(chatId)}
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        rows={4}
      />
    </div>
  );
}

// ============================================================================
// Example 5: Group Chat with Individual User Display
// ============================================================================

export function GroupChatTypingExample({ chatId, currentUser }) {
  const {
    setTyping,
    whoIsTyping,
    typingUsers,
    subscribeToChat,
  } = useTypingIndicator(currentUser.id, currentUser.username);

  useEffect(() => {
    subscribeToChat(chatId);
  }, [chatId, subscribeToChat]);

  const typingList = whoIsTyping(chatId);
  const chatTyping = typingUsers[chatId] || [];

  return (
    <div className="group-chat">
      {/* Show each typing user individually */}
      {chatTyping.length > 0 && (
        <div className="typing-users-list">
          {chatTyping.map((user) => (
            <div key={user.userId} className="typing-user-item">
              <div className="user-avatar">{user.username.charAt(0)}</div>
              <div className="typing-indicator-small">
                <span>{user.username}</span>
                <div className="dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact typing indicator */}
      {typingList.length > 0 && (
        <div className="typing-compact">
          {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 6: Direct Message with Simple Boolean Check
// ============================================================================

export function DirectMessageExample({ chatId, currentUser, otherUser }) {
  const { isAnyoneTyping, setTyping, subscribeToChat } = useTypingIndicator(
    currentUser.id,
    currentUser.username
  );

  useEffect(() => {
    subscribeToChat(chatId);
  }, [chatId, subscribeToChat]);

  const isOtherUserTyping = isAnyoneTyping(chatId);

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h3>{otherUser.username}</h3>
        {isOtherUserTyping && <span className="status-typing">typing...</span>}
      </div>
      <div className="dm-messages">{/* Messages */}</div>
      <input
        type="text"
        onChange={(e) => setTyping(chatId, e.target.value.length > 0)}
        placeholder={`Message ${otherUser.username}`}
      />
    </div>
  );
}

// ============================================================================
// CSS Styles Example
// ============================================================================

const exampleStyles = `
/* Typing Indicator Styles */
.typing-indicator {
  padding: 8px 12px;
  font-size: 14px;
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 8px;
}

.typing-dots span {
  animation: blink 1.4s infinite;
  animation-fill-mode: both;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 80%, 100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}

.typing-indicator-custom {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 12px;
}

.typing-avatars {
  display: flex;
  gap: -8px;
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4A90E2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: 2px solid white;
}

.typing-animation span {
  width: 6px;
  height: 6px;
  background: #666;
  border-radius: 50%;
  display: inline-block;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-animation span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-animation span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.status-typing {
  font-size: 12px;
  color: #4A90E2;
  font-style: italic;
}
`;

export { exampleStyles };
