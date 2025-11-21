# 🎨 Sticker Picker System - Complete Guide

## Overview
The StickerPicker component provides a comprehensive sticker selection system with custom packs, search functionality, favorites, and recently used tracking.

---

## 📦 Features

### Sticker Packs
1. **Emoji Reactions** (❤️😂😮😢👏)
   - 20 popular emoji reactions
   - Perfect for quick responses
   
2. **Focus Brand** (⚡🎯💡🚀🏆)
   - 15 Focus app branded stickers
   - App-specific expressions
   
3. **Festivals** (🪔🎆🎨🎄🌙)
   - Diwali, Holi, Christmas, Eid, etc.
   - 20 festival stickers
   
4. **Trending** (😏🫡👀💀🐐)
   - 20 trending meme reactions
   - Safe for work only

### Core Features
- ✨ Pack selector tabs with icons
- 🔍 Real-time search across all packs
- ⭐ Favorite stickers
- 🕐 Recently used section (last 10)
- 📱 Responsive design
- 🌙 Dark mode support
- ♿ Full accessibility

---

## 🚀 Usage

### Basic Usage

```jsx
import React, { useState } from 'react';
import StickerPicker from './components/StickerPicker';

function MessageComposer() {
  const [showPicker, setShowPicker] = useState(false);
  const [message, setMessage] = useState('');

  const handleStickerSelect = (sticker) => {
    setMessage(prev => prev + sticker.content);
    setShowPicker(false);
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      
      <button onClick={() => setShowPicker(!showPicker)}>
        Add Sticker
      </button>

      {showPicker && (
        <StickerPicker
          onSelect={handleStickerSelect}
          onClose={() => setShowPicker(false)}
          context="message"
        />
      )}
    </div>
  );
}
```

### In Chat/Messages

```jsx
// src/components/ChatInput.js
import React, { useState } from 'react';
import StickerPicker from './StickerPicker';
import { Sticker } from 'lucide-react';

function ChatInput({ onSend }) {
  const [message, setMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);

  const handleStickerSelect = (sticker) => {
    // Add sticker to message
    setMessage(prev => prev + sticker.content);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
      setShowStickers(false);
    }
  };

  return (
    <div className="chat-input-container">
      <div className="input-wrapper">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        
        <button 
          className="sticker-btn"
          onClick={() => setShowStickers(!showStickers)}
          title="Add sticker"
        >
          <Sticker size={20} />
        </button>

        <button onClick={handleSend}>Send</button>
      </div>

      {showStickers && (
        <div className="sticker-picker-overlay">
          <StickerPicker
            onSelect={handleStickerSelect}
            onClose={() => setShowStickers(false)}
            context="message"
          />
        </div>
      )}
    </div>
  );
}

export default ChatInput;
```

### In Comments

```jsx
// src/components/CommentSection.js
import React, { useState } from 'react';
import StickerPicker from './StickerPicker';

function CommentBox({ postId, onComment }) {
  const [comment, setComment] = useState('');
  const [showStickers, setShowStickers] = useState(false);

  const handleStickerSelect = (sticker) => {
    setComment(prev => prev + sticker.content);
  };

  const handleSubmit = () => {
    if (comment.trim()) {
      onComment({ postId, text: comment });
      setComment('');
    }
  };

  return (
    <div className="comment-box">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
      />
      
      <div className="comment-actions">
        <button onClick={() => setShowStickers(!showStickers)}>
          🎨 Sticker
        </button>
        <button onClick={handleSubmit}>Post</button>
      </div>

      {showStickers && (
        <StickerPicker
          onSelect={handleStickerSelect}
          onClose={() => setShowStickers(false)}
          context="comment"
        />
      )}
    </div>
  );
}
```

### In Story/Flash Overlay

```jsx
// src/components/StoryEditor.js
import React, { useState } from 'react';
import StickerPicker from './StickerPicker';

function StoryEditor({ image, onSave }) {
  const [stickers, setStickers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const handleStickerSelect = (sticker) => {
    // Add sticker at center position
    const newSticker = {
      id: Date.now(),
      content: sticker.content,
      x: 50, // center X
      y: 50, // center Y
      rotation: 0,
      scale: 1
    };
    
    setStickers([...stickers, newSticker]);
    setShowPicker(false);
  };

  return (
    <div className="story-editor">
      <div className="canvas">
        <img src={image} alt="Story" />
        
        {stickers.map(sticker => (
          <div
            key={sticker.id}
            className="placed-sticker"
            style={{
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`
            }}
          >
            {sticker.content}
          </div>
        ))}
      </div>

      <div className="editor-toolbar">
        <button onClick={() => setShowPicker(true)}>
          Add Sticker
        </button>
        <button onClick={() => onSave({ image, stickers })}>
          Share
        </button>
      </div>

      {showPicker && (
        <div className="sticker-picker-modal">
          <StickerPicker
            onSelect={handleStickerSelect}
            onClose={() => setShowPicker(false)}
            context="story"
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Component Props

```typescript
interface StickerPickerProps {
  onSelect: (sticker: Sticker) => void;  // Callback when sticker selected
  onClose?: () => void;                  // Callback to close picker
  context?: 'message' | 'comment' | 'story' | 'flash'; // Usage context
}

interface Sticker {
  id: string;           // Unique sticker ID
  content: string;      // Emoji/sticker content
  tags: string[];       // Searchable tags
  packId?: string;      // Pack identifier (when searching)
}
```

---

## 🎯 Integration Examples

### Modal Overlay

```jsx
import React from 'react';
import StickerPicker from './StickerPicker';
import './StickerModal.css';

function StickerModal({ isOpen, onSelect, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="sticker-modal-overlay" onClick={onClose}>
      <div 
        className="sticker-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <StickerPicker
          onSelect={onSelect}
          onClose={onClose}
          context="message"
        />
      </div>
    </div>
  );
}

export default StickerModal;
```

```css
/* StickerModal.css */
.sticker-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.sticker-modal-content {
  margin: 20px;
}
```

### Popover Style

```jsx
import React, { useRef, useEffect } from 'react';
import StickerPicker from './StickerPicker';

function StickerPopover({ isOpen, onSelect, onClose, triggerRef }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div ref={popoverRef} className="sticker-popover">
      <StickerPicker
        onSelect={onSelect}
        onClose={onClose}
        context="message"
      />
    </div>
  );
}
```

---

## 📱 Responsive Behavior

- **Desktop**: Full-size picker (420x480px)
- **Mobile**: Full-screen overlay
- **Tablet**: Centered modal

---

## 🎨 Customization

### Adding New Sticker Packs

```javascript
// Edit STICKER_PACKS in StickerPicker.js

const STICKER_PACKS = {
  // ... existing packs
  
  custom: {
    id: 'custom',
    name: 'Custom Pack',
    icon: YourIcon,  // Import from lucide-react
    stickers: [
      { 
        id: 'custom-1', 
        content: '🎮', 
        tags: ['game', 'play', 'fun'] 
      },
      // Add more...
    ]
  }
};
```

### Custom Styling

```css
/* Override in your app's CSS */
.sticker-picker {
  --primary-color: #667eea;
  --hover-bg: rgba(102, 126, 234, 0.1);
  --border-color: #e5e7eb;
}

/* Custom theme */
.sticker-picker.theme-pink {
  --primary-color: #ec4899;
  --hover-bg: rgba(236, 72, 153, 0.1);
}
```

---

## 🔍 Search Functionality

The search feature:
- Searches across ALL sticker packs
- Matches against tags and content
- Case-insensitive
- Real-time results
- Shows result count

Example search terms:
- "love" → ❤️💖😍
- "party" → 🎉🎊🎈
- "diwali" → 🪔🎆🎇
- "laugh" → 😂🤣

---

## ⭐ Favorites & Recents

### Favorites
- Click star icon on any sticker
- Persisted in localStorage
- Shows in dedicated section
- Syncs across sessions

### Recently Used
- Auto-tracks last 20 stickers
- Shows top 10 in dedicated section
- Most recent first
- Persisted in localStorage

### Storage Structure

```javascript
// localStorage keys
localStorage.getItem('recentStickers')    // ["emoji-1", "fest-5", ...]
localStorage.getItem('favoriteStickers')  // ["emoji-2", "focus-1", ...]
```

---

## ♿ Accessibility

- Full keyboard navigation
- ARIA labels on all buttons
- Focus visible indicators
- Screen reader friendly
- High contrast support

---

## 🎭 Context Hints

The footer shows context-specific hints:
- 💬 **message**: "Send in message"
- 💭 **comment**: "Add to comment"
- 📸 **story**: "Add to story"
- ⚡ **flash**: "Add to flash"

---

## 🐛 Troubleshooting

### Stickers not showing
```javascript
// Check if lucide-react is installed
npm install lucide-react
```

### Picker not closing
```javascript
// Ensure onClose is passed
<StickerPicker
  onSelect={handleSelect}
  onClose={() => setShowPicker(false)}  // ✅ Required
/>
```

### Search not working
```javascript
// Check tags are lowercase
tags: ['love', 'heart', 'like']  // ✅ Correct
tags: ['Love', 'Heart', 'Like']  // ❌ Won't match
```

---

## 📊 Performance

- Memoized filtered results
- Optimized re-renders with React.memo
- Lazy localStorage access
- Efficient search algorithm
- Virtual scrolling ready

---

## 🎉 Example: Full Chat Integration

```jsx
// src/pages/Chat.js
import React, { useState, useRef } from 'react';
import StickerPicker from '../components/StickerPicker';
import { Sticker, Send } from 'lucide-react';
import './Chat.css';

function Chat({ chatId }) {
  const [message, setMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const stickerBtnRef = useRef(null);

  const handleStickerSelect = (sticker) => {
    setMessage(prev => prev + sticker.content);
    setShowStickers(false);
  };

  const handleSend = () => {
    if (message.trim()) {
      // Send message logic
      console.log('Sending:', message);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {/* Messages list */}
      </div>

      <div className="chat-input-wrapper">
        <div className="input-group">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="message-input"
          />

          <button
            ref={stickerBtnRef}
            onClick={() => setShowStickers(!showStickers)}
            className="icon-btn"
            title="Add sticker"
          >
            <Sticker size={22} />
          </button>

          <button
            onClick={handleSend}
            className="send-btn"
            disabled={!message.trim()}
          >
            <Send size={22} />
          </button>
        </div>

        {showStickers && (
          <div className="sticker-picker-dropdown">
            <StickerPicker
              onSelect={handleStickerSelect}
              onClose={() => setShowStickers(false)}
              context="message"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
```

---

## 📝 Best Practices

1. **Always provide onClose**: Allows users to dismiss picker
2. **Use context prop**: Shows relevant hint to users
3. **Handle sticker data**: Store sticker ID and content in messages
4. **Accessibility**: Keep keyboard navigation working
5. **Mobile first**: Test on small screens
6. **Performance**: Don't render picker until needed
7. **Storage**: Clear old recents periodically

---

## 🚀 Future Enhancements

- [ ] Animated stickers (GIF support)
- [ ] Custom user stickers
- [ ] Sticker pack downloads
- [ ] Size adjustment
- [ ] Sticker reactions on messages
- [ ] Trending pack auto-update
- [ ] Multi-language tags
- [ ] Sticker analytics

---

## 📄 License

Part of the Focus App project.

---

## 🤝 Support

For issues or questions about the sticker system, check:
- Component code: `src/components/StickerPicker.js`
- Styles: `src/components/StickerPicker.css`
- This guide: `STICKER-SYSTEM-GUIDE.md`
