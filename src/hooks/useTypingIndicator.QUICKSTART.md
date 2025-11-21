# 🚀 useTypingIndicator Quick Start Guide

## Installation (Already Done!)

The hook is already installed at:
```
src/hooks/useTypingIndicator.js
```

## 5-Minute Integration

### Step 1: Import the Hook

```javascript
import useTypingIndicator from '../hooks/useTypingIndicator';
```

### Step 2: Initialize in Your Chat Component

```javascript
function ChatComponent({ chatId, currentUser }) {
  const {
    setTyping,
    getTypingText,
    isAnyoneTyping,
    subscribeToChat,
    unsubscribeFromChat
  } = useTypingIndicator(currentUser.id, currentUser.username);
  
  // ... rest of component
}
```

### Step 3: Subscribe to Chat

```javascript
useEffect(() => {
  subscribeToChat(chatId);
  
  return () => {
    unsubscribeFromChat(chatId);
  };
}, [chatId, subscribeToChat, unsubscribeFromChat]);
```

### Step 4: Emit Typing Events

```javascript
const [message, setMessage] = useState('');

const handleInputChange = (e) => {
  const value = e.target.value;
  setMessage(value);
  
  // Emit typing indicator
  if (value.length > 0) {
    setTyping(chatId, true);
  } else {
    setTyping(chatId, false);
  }
};

const handleSendMessage = () => {
  setTyping(chatId, false); // Stop typing when sent
  // ... send message logic
  setMessage('');
};
```

### Step 5: Display Typing Indicator

```javascript
return (
  <div className="chat-container">
    <div className="chat-messages">
      {/* Your messages */}
    </div>
    
    {/* Typing Indicator */}
    {isAnyoneTyping(chatId) && (
      <div className="typing-indicator">
        {getTypingText(chatId)}
      </div>
    )}
    
    {/* Chat Input */}
    <input
      type="text"
      value={message}
      onChange={handleInputChange}
      onBlur={() => setTyping(chatId, false)}
      placeholder="Type a message..."
    />
    <button onClick={handleSendMessage}>Send</button>
  </div>
);
```

## Complete Working Example

```javascript
import React, { useState, useEffect } from 'react';
import useTypingIndicator from '../hooks/useTypingIndicator';

function ChatRoom({ chatId, currentUser }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const {
    setTyping,
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
    setTyping(chatId, value.length > 0);
  };

  const handleSend = () => {
    if (message.trim()) {
      // Add message to list
      setMessages([...messages, { text: message, user: currentUser.username }]);
      
      // Stop typing
      setTyping(chatId, false);
      
      // Clear input
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-room">
      {/* Header */}
      <div className="chat-header">
        <h2>Chat Room</h2>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className="message">
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
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

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTyping(chatId, false)}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatRoom;
```

## Styling

```css
/* Typing Indicator */
.typing-indicator {
  padding: 12px;
  font-size: 14px;
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 8px 0;
}

.typing-text {
  flex: 1;
}

.typing-dots {
  display: flex;
  gap: 2px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #666;
  border-radius: 50%;
  display: inline-block;
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

/* Chat Container */
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.chat-header {
  padding: 16px;
  background: #4A90E2;
  color: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  padding: 8px 12px;
  margin: 8px 0;
  background: #f0f0f0;
  border-radius: 8px;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.chat-input button {
  padding: 12px 24px;
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.chat-input button:hover {
  background: #357ABD;
}
```

## Common Patterns

### Pattern 1: Simple Boolean Check
```javascript
{isAnyoneTyping(chatId) && <div>Someone is typing...</div>}
```

### Pattern 2: Show Who is Typing
```javascript
<div>{getTypingText(chatId)}</div>
```

### Pattern 3: Get User List
```javascript
const typingUsers = whoIsTyping(chatId);
// ['John', 'Sarah']
```

### Pattern 4: Stop on Blur
```javascript
<input onBlur={() => setTyping(chatId, false)} />
```

### Pattern 5: Stop on Send
```javascript
const handleSend = () => {
  setTyping(chatId, false);
  sendMessage();
};
```

## Tips

1. **Always subscribe** - Call `subscribeToChat()` in `useEffect`
2. **Stop typing on send** - Clear indicator when message is sent
3. **Stop on blur** - Clear when user leaves input
4. **Don't over-emit** - Debouncing is automatic, don't add more
5. **Cleanup** - Return unsubscribe function in `useEffect`

## Troubleshooting

### Typing Not Showing?
```javascript
// Check 1: Are you subscribed?
useEffect(() => {
  subscribeToChat(chatId);
}, [chatId]);

// Check 2: Are you calling setTyping?
onChange={(e) => setTyping(chatId, e.target.value.length > 0)}
```

### Typing Not Clearing?
```javascript
// Stop on send
onClick={() => {
  setTyping(chatId, false);
  sendMessage();
}}

// Stop on blur
onBlur={() => setTyping(chatId, false)}
```

## Next Steps

1. ✅ Copy the complete example above
2. ✅ Replace `chatId` and `currentUser` with your data
3. ✅ Add the CSS styles
4. ✅ Test in your application
5. ✅ Customize as needed

## Documentation

- **Full API**: See `useTypingIndicator.README.md`
- **Examples**: See `useTypingIndicator.example.js`
- **Tests**: See `useTypingIndicator.test.js`

---

**You're ready to go! 🎉**

Start using typing indicators in your chat app in just 5 minutes!
