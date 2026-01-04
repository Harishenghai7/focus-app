# useTypingIndicator Hook

## Overview

The `useTypingIndicator` hook provides real-time "User is typing..." indicators for chat applications using Supabase realtime channels.

## Features

✅ **Real-time Broadcasting** - Emit typing events to Supabase channels  
✅ **Live Updates** - Listen for other users' typing indicators  
✅ **Auto-clear** - Automatically clears typing after 3 seconds of inactivity  
✅ **Debouncing** - Prevents spamming typing events (500ms debounce)  
✅ **Multi-chat Support** - Manage typing indicators across multiple chats  
✅ **Formatted Output** - Get formatted typing text ("John is typing...")  
✅ **Memory Efficient** - Automatic cleanup and timer management

## Installation

The hook is already included in your project at:
```
src/hooks/useTypingIndicator.js
```

## Basic Usage

```javascript
import useTypingIndicator from '../hooks/useTypingIndicator';

function ChatComponent({ chatId, currentUser }) {
  const {
    setTyping,
    getTypingText,
    isAnyoneTyping,
    subscribeToChat
  } = useTypingIndicator(currentUser.id, currentUser.username);

  // Subscribe to chat on mount
  useEffect(() => {
    subscribeToChat(chatId);
  }, [chatId]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Emit typing indicator
    if (value.length > 0) {
      setTyping(chatId, true);
    } else {
      setTyping(chatId, false);
    }
  };

  return (
    <div>
      {isAnyoneTyping(chatId) && (
        <div className="typing-indicator">
          {getTypingText(chatId)}
        </div>
      )}
      <input onChange={handleInputChange} />
    </div>
  );
}
```

## API Reference

### Parameters

```javascript
useTypingIndicator(currentUserId, currentUsername)
```

- **currentUserId** (string, required) - The ID of the current user
- **currentUsername** (string, required) - The username to display in typing indicators

### Return Value

The hook returns an object with the following properties:

#### Core Methods

##### `setTyping(chatId, isTyping)`
Emit a typing indicator to a chat channel.

- **chatId** (string) - The chat ID
- **isTyping** (boolean) - Whether the user is typing
- **Debounced**: Only emits if 500ms has passed since last emit
- **Auto-clears**: Automatically stops after 3 seconds

```javascript
// User starts typing
setTyping('chat-123', true);

// User stops typing
setTyping('chat-123', false);
```

##### `stopTyping(chatId)`
Stop typing indicator for the current user.

- **chatId** (string) - The chat ID

```javascript
// Stop typing when message is sent
stopTyping('chat-123');
```

##### `whoIsTyping(chatId)`
Get array of usernames currently typing.

- **chatId** (string) - The chat ID
- **Returns**: Array<string> - Array of usernames

```javascript
const typingUsers = whoIsTyping('chat-123');
// ['John', 'Sarah', 'Mike']
```

#### Helper Methods

##### `getTypingText(chatId)`
Get formatted typing indicator text.

- **chatId** (string) - The chat ID
- **Returns**: string - Formatted text

```javascript
getTypingText('chat-123');
// "John is typing..."
// "John and Sarah are typing..."
// "John and 2 others are typing..."
```

##### `isAnyoneTyping(chatId)`
Check if anyone is typing in a chat.

- **chatId** (string) - The chat ID
- **Returns**: boolean

```javascript
if (isAnyoneTyping('chat-123')) {
  // Show typing indicator UI
}
```

#### Channel Management

##### `subscribeToChat(chatId)`
Subscribe to typing indicators for a chat.

- **chatId** (string) - The chat ID
- Call this when a chat is opened or mounted

```javascript
useEffect(() => {
  subscribeToChat('chat-123');
}, [chatId]);
```

##### `unsubscribeFromChat(chatId)`
Unsubscribe from typing indicators for a chat.

- **chatId** (string) - The chat ID
- Call this when a chat is closed or unmounted

```javascript
useEffect(() => {
  subscribeToChat('chat-123');
  return () => unsubscribeFromChat('chat-123');
}, [chatId]);
```

#### State

##### `typingUsers`
Raw typing state object for advanced use cases.

```javascript
{
  'chat-123': [
    { userId: 'user-1', username: 'John', timestamp: 1699999999999 },
    { userId: 'user-2', username: 'Sarah', timestamp: 1699999999999 }
  ]
}
```

## Configuration

### Timing Constants

```javascript
DEBOUNCE_DELAY = 500;     // Wait 500ms between typing events
AUTO_CLEAR_DELAY = 3000;  // Clear typing after 3 seconds
```

These are configurable in the hook implementation if needed.

## Usage Patterns

### Pattern 1: Simple Text Input

```javascript
function SimpleChat({ chatId, currentUser }) {
  const [message, setMessage] = useState('');
  const { setTyping, getTypingText, subscribeToChat } = 
    useTypingIndicator(currentUser.id, currentUser.username);

  useEffect(() => {
    subscribeToChat(chatId);
  }, [chatId]);

  return (
    <div>
      <div>{getTypingText(chatId)}</div>
      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setTyping(chatId, e.target.value.length > 0);
        }}
      />
    </div>
  );
}
```

### Pattern 2: Textarea with Enter to Send

```javascript
function TextareaChat({ chatId, currentUser }) {
  const { setTyping, stopTyping } = 
    useTypingIndicator(currentUser.id, currentUser.username);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopTyping(chatId); // Stop typing when message sent
      // ... send message
    }
  };

  return (
    <textarea
      onChange={(e) => setTyping(chatId, e.target.value.length > 0)}
      onKeyDown={handleKeyDown}
      onBlur={() => stopTyping(chatId)} // Stop on blur
    />
  );
}
```

### Pattern 3: Multiple Chats

```javascript
function MultiChat({ currentUser }) {
  const [chats] = useState(['chat-1', 'chat-2', 'chat-3']);
  const { getTypingText, subscribeToChat, unsubscribeFromChat } = 
    useTypingIndicator(currentUser.id, currentUser.username);

  useEffect(() => {
    chats.forEach(chatId => subscribeToChat(chatId));
    return () => {
      chats.forEach(chatId => unsubscribeFromChat(chatId));
    };
  }, [chats]);

  return (
    <div>
      {chats.map(chatId => (
        <div key={chatId}>
          <h3>Chat {chatId}</h3>
          <p>{getTypingText(chatId)}</p>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 4: Direct Message (1-on-1)

```javascript
function DirectMessage({ chatId, currentUser, otherUser }) {
  const { isAnyoneTyping, setTyping, subscribeToChat } = 
    useTypingIndicator(currentUser.id, currentUser.username);

  useEffect(() => {
    subscribeToChat(chatId);
  }, [chatId]);

  return (
    <div>
      <div className="dm-header">
        <h3>{otherUser.username}</h3>
        {isAnyoneTyping(chatId) && <span>typing...</span>}
      </div>
      <input onChange={(e) => setTyping(chatId, e.target.value.length > 0)} />
    </div>
  );
}
```

### Pattern 5: Group Chat with User List

```javascript
function GroupChat({ chatId, currentUser }) {
  const { whoIsTyping, typingUsers, subscribeToChat } = 
    useTypingIndicator(currentUser.id, currentUser.username);

  useEffect(() => {
    subscribeToChat(chatId);
  }, [chatId]);

  const typing = whoIsTyping(chatId);
  const typingData = typingUsers[chatId] || [];

  return (
    <div>
      {typingData.map(user => (
        <div key={user.userId}>
          <span>{user.username}</span>
          <span className="typing-dots">...</span>
        </div>
      ))}
    </div>
  );
}
```

## UI Examples

### Minimal Typing Indicator

```jsx
{isAnyoneTyping(chatId) && (
  <div className="typing">
    {getTypingText(chatId)}
  </div>
)}
```

### Animated Dots

```jsx
{isAnyoneTyping(chatId) && (
  <div className="typing-indicator">
    <span>{getTypingText(chatId)}</span>
    <span className="dots">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  </div>
)}
```

```css
.dots span {
  animation: blink 1.4s infinite;
}
.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}
```

### With Avatars

```jsx
{typingUsers[chatId]?.length > 0 && (
  <div className="typing-with-avatars">
    <div className="avatars">
      {typingUsers[chatId].map(user => (
        <div key={user.userId} className="avatar">
          {user.username.charAt(0)}
        </div>
      ))}
    </div>
    <span>{getTypingText(chatId)}</span>
  </div>
)}
```

## Best Practices

### 1. Always Subscribe to Chats
```javascript
// ✅ Good
useEffect(() => {
  subscribeToChat(chatId);
  return () => unsubscribeFromChat(chatId);
}, [chatId]);

// ❌ Bad - No subscription
const { setTyping } = useTypingIndicator(userId, username);
setTyping(chatId, true); // Won't work without subscription
```

### 2. Stop Typing on Message Send
```javascript
// ✅ Good
const handleSend = () => {
  stopTyping(chatId);
  sendMessage();
};

// ❌ Bad - Typing indicator stays active
const handleSend = () => {
  sendMessage();
};
```

### 3. Stop Typing on Input Blur
```javascript
// ✅ Good
<input
  onChange={(e) => setTyping(chatId, e.target.value.length > 0)}
  onBlur={() => stopTyping(chatId)}
/>

// ❌ Bad - No blur handler
<input onChange={(e) => setTyping(chatId, true)} />
```

### 4. Use Helper Methods
```javascript
// ✅ Good - Use getTypingText
<div>{getTypingText(chatId)}</div>

// ❌ Bad - Manual formatting
const users = whoIsTyping(chatId);
<div>{users.join(', ')} is typing...</div>
```

### 5. Clean Up Subscriptions
```javascript
// ✅ Good
useEffect(() => {
  subscribeToChat(chatId);
  return () => unsubscribeFromChat(chatId);
}, [chatId]);

// ❌ Bad - Memory leak
useEffect(() => {
  subscribeToChat(chatId);
}, [chatId]);
```

## Performance Tips

1. **Debouncing is Automatic** - Don't add additional debouncing
2. **Auto-clear is Built-in** - No manual cleanup needed
3. **Subscribe Once** - Don't re-subscribe on every render
4. **Unsubscribe on Unmount** - Prevents memory leaks
5. **Use isAnyoneTyping** - More efficient than whoIsTyping for boolean checks

## Troubleshooting

### Typing Indicator Not Showing

```javascript
// Check 1: Are you subscribed?
useEffect(() => {
  subscribeToChat(chatId);
}, [chatId]);

// Check 2: Is Supabase configured?
import { supabase } from '../supabaseClient';

// Check 3: Check browser console for errors
```

### Typing Indicator Not Clearing

```javascript
// Issue: Not calling stopTyping
// Solution: Call stopTyping on send/blur
<input
  onBlur={() => stopTyping(chatId)}
  onChange={(e) => {
    if (!e.target.value) {
      stopTyping(chatId);
    }
  }}
/>
```

### Multiple Users Not Showing

```javascript
// Issue: Only showing one user
// Solution: Use getTypingText or whoIsTyping
const users = whoIsTyping(chatId); // Returns array
const text = getTypingText(chatId); // Handles multiple users
```

### Performance Issues

```javascript
// Issue: Too many subscriptions
// Solution: Unsubscribe when not needed
useEffect(() => {
  if (isVisible) {
    subscribeToChat(chatId);
  } else {
    unsubscribeFromChat(chatId);
  }
}, [isVisible, chatId]);
```

## Dependencies

- **React** - useState, useEffect, useRef, useCallback hooks
- **Supabase** - Realtime channels for broadcasting

## Technical Details

### Channel Naming
- Channels are named: `typing:{chatId}`
- Example: `typing:chat-123`

### Event Structure
```javascript
{
  type: 'broadcast',
  event: 'typing',
  payload: {
    userId: 'user-123',
    username: 'John',
    isTyping: true
  }
}
```

### Timer Management
- **Debounce Timer**: Prevents rapid typing events (500ms)
- **Auto-clear Timer**: Clears typing after inactivity (3000ms)
- **Stale Timer**: Removes other users' typing (3000ms)

### Memory Management
- All timers cleared on unmount
- Channels properly unsubscribed
- State cleaned up automatically

## Related Hooks

- **usePresence** - Track user online/offline status
- **useRealtimeMessages** - Real-time message updates
- **useReadReceipts** - Track message read status

## Examples

See `useTypingIndicator.example.js` for complete working examples including:
- Basic chat input
- Multiple chats
- Group chat with avatars
- Direct messages
- Textarea with Enter to send
- Custom UI implementations

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase configuration
3. Review the examples file
4. Check subscription status in component

## Version

Current Version: 1.0.0  
Last Updated: November 16, 2025

---

**Ready to use!** Import the hook and start building real-time typing indicators. 🎯
