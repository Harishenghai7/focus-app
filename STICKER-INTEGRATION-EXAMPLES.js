/**
 * Quick Integration Examples for Sticker Picker
 * Copy and paste these snippets into your existing components
 */

// ============================================
// 1. CHAT INPUT INTEGRATION
// ============================================

// Add to src/components/ChatInput.js or similar
import StickerPicker from './StickerPicker';
import { Sticker } from 'lucide-react';

// Add to component state
const [showStickers, setShowStickers] = useState(false);

// Add to your input area JSX
<button 
  onClick={() => setShowStickers(!showStickers)}
  className="sticker-button"
  title="Add sticker"
>
  <Sticker size={20} />
</button>

{showStickers && (
  <div className="sticker-picker-popup">
    <StickerPicker
      onSelect={(sticker) => {
        setMessage(prev => prev + sticker.content);
        setShowStickers(false);
      }}
      onClose={() => setShowStickers(false)}
      context="message"
    />
  </div>
)}

// Add CSS for positioning
/*
.sticker-picker-popup {
  position: absolute;
  bottom: 60px;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
*/


// ============================================
// 2. COMMENT SECTION INTEGRATION
// ============================================

// Add to CommentSection or PostCard component
import StickerPicker from './StickerPicker';

// In your comment input
const [commentText, setCommentText] = useState('');
const [showStickerPicker, setShowStickerPicker] = useState(false);

// In JSX
<div className="comment-input-wrapper">
  <textarea
    value={commentText}
    onChange={(e) => setCommentText(e.target.value)}
    placeholder="Add a comment..."
  />
  
  <div className="comment-actions">
    <button onClick={() => setShowStickerPicker(true)}>
      🎨 Sticker
    </button>
    <button onClick={handlePostComment}>Post</button>
  </div>

  {showStickerPicker && (
    <div className="sticker-modal-overlay" onClick={() => setShowStickerPicker(false)}>
      <div className="sticker-modal" onClick={(e) => e.stopPropagation()}>
        <StickerPicker
          onSelect={(sticker) => {
            setCommentText(prev => prev + ' ' + sticker.content);
            setShowStickerPicker(false);
          }}
          onClose={() => setShowStickerPicker(false)}
          context="comment"
        />
      </div>
    </div>
  )}
</div>


// ============================================
// 3. DIRECT MESSAGE INTEGRATION
// ============================================

// Add to DirectMessage or ChatThread component
import StickerPicker from './StickerPicker';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage({
        text: message,
        type: 'text',
        timestamp: new Date()
      });
      setMessage('');
    }
  };

  return (
    <div className="dm-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Send a message..."
      />
      
      <button onClick={() => setShowStickers(!showStickers)}>
        <span>😀</span>
      </button>

      <button onClick={handleSend}>Send</button>

      {showStickers && (
        <div className="stickers-dropdown">
          <StickerPicker
            onSelect={(sticker) => {
              setMessage(prev => prev + sticker.content);
            }}
            onClose={() => setShowStickers(false)}
            context="message"
          />
        </div>
      )}
    </div>
  );
};


// ============================================
// 4. STORY/FLASH EDITOR INTEGRATION
// ============================================

// Add to StoryCreator or FlashCreator component
import StickerPicker from './StickerPicker';

const StoryEditor = ({ image, onPublish }) => {
  const [placedStickers, setPlacedStickers] = useState([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const addSticker = (sticker) => {
    setPlacedStickers([...placedStickers, {
      id: Date.now(),
      content: sticker.content,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    }]);
    setShowStickerPicker(false);
  };

  return (
    <div className="story-editor">
      <div className="canvas">
        <img src={image} alt="Story" />
        
        {placedStickers.map(sticker => (
          <div
            key={sticker.id}
            className="sticker-overlay"
            style={{
              position: 'absolute',
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              fontSize: '48px',
              transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              cursor: 'move'
            }}
          >
            {sticker.content}
          </div>
        ))}
      </div>

      <div className="editor-toolbar">
        <button onClick={() => setShowStickerPicker(true)}>
          Add Sticker
        </button>
        <button onClick={() => onPublish({ image, stickers: placedStickers })}>
          Share Story
        </button>
      </div>

      {showStickerPicker && (
        <div className="modal-overlay">
          <StickerPicker
            onSelect={addSticker}
            onClose={() => setShowStickerPicker(false)}
            context="story"
          />
        </div>
      )}
    </div>
  );
};


// ============================================
// 5. REUSABLE STICKER BUTTON COMPONENT
// ============================================

// Create a reusable component: src/components/StickerButton.js
import React, { useState } from 'react';
import StickerPicker from './StickerPicker';
import { Sticker } from 'lucide-react';

const StickerButton = ({ onSelect, context = 'message', className = '' }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className={`sticker-button-wrapper ${className}`}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="sticker-trigger-btn"
        title="Add sticker"
      >
        <Sticker size={20} />
      </button>

      {showPicker && (
        <div className="sticker-picker-container">
          <StickerPicker
            onSelect={(sticker) => {
              onSelect(sticker);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
            context={context}
          />
        </div>
      )}
    </div>
  );
};

export default StickerButton;

// Usage:
// <StickerButton 
//   onSelect={(sticker) => handleSticker(sticker)} 
//   context="comment" 
// />


// ============================================
// 6. MODAL WRAPPER (REUSABLE)
// ============================================

// Create: src/components/StickerModal.js
import React from 'react';
import StickerPicker from './StickerPicker';
import './StickerModal.css';

const StickerModal = ({ isOpen, onSelect, onClose, context = 'message' }) => {
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
          context={context}
        />
      </div>
    </div>
  );
};

export default StickerModal;

// Usage anywhere:
// const [showModal, setShowModal] = useState(false);
// 
// <StickerModal
//   isOpen={showModal}
//   onSelect={(sticker) => {
//     handleSticker(sticker);
//     setShowModal(false);
//   }}
//   onClose={() => setShowModal(false)}
//   context="message"
// />


// ============================================
// 7. CSS FOR COMMON LAYOUTS
// ============================================

/*
// Add to your component's CSS file

// Dropdown style (for input areas)
.sticker-picker-popup {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 10px;
  z-index: 1000;
}

// Modal overlay style
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
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.sticker-modal-content {
  margin: 20px;
}

// Inline style (for toolbars)
.stickers-dropdown {
  position: relative;
  display: inline-block;
}

.sticker-button-wrapper {
  position: relative;
}

.sticker-picker-container {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  z-index: 100;
}

// Trigger button styling
.sticker-trigger-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #6b7280;
}

.sticker-trigger-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}
*/


// ============================================
// 8. HANDLING STICKER DATA IN MESSAGES
// ============================================

// When sending messages with stickers
const sendMessage = (text) => {
  const messageData = {
    id: generateId(),
    senderId: currentUser.id,
    recipientId: otherUser.id,
    content: text,  // Contains emoji/stickers
    type: 'text',
    timestamp: new Date(),
    read: false
  };

  // Send to backend
  api.post('/messages', messageData);
};

// Displaying messages with stickers
const MessageBubble = ({ message }) => (
  <div className="message-bubble">
    <p className="message-text">
      {message.content} {/* Stickers render as emoji */}
    </p>
    <span className="message-time">
      {formatTime(message.timestamp)}
    </span>
  </div>
);


// ============================================
// 9. CUSTOM POSITIONING EXAMPLES
// ============================================

// Bottom-right corner
<div style={{ position: 'relative' }}>
  {showStickers && (
    <div style={{
      position: 'absolute',
      bottom: '60px',
      right: '0',
      zIndex: 1000
    }}>
      <StickerPicker onSelect={handleSelect} onClose={closeStickers} />
    </div>
  )}
</div>

// Centered modal
<div style={{
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1000
}}>
  <StickerPicker onSelect={handleSelect} onClose={closeStickers} />
</div>

// Full screen mobile
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'white',
  zIndex: 1000
}}>
  <StickerPicker onSelect={handleSelect} onClose={closeStickers} />
</div>


// ============================================
// 10. ACCESSIBILITY EXAMPLE
// ============================================

const AccessibleStickerButton = ({ onSelect }) => {
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showPicker) {
        setShowPicker(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPicker]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setShowPicker(!showPicker)}
        aria-label="Open sticker picker"
        aria-expanded={showPicker}
        aria-haspopup="dialog"
      >
        Add Sticker
      </button>

      {showPicker && (
        <div role="dialog" aria-label="Sticker picker">
          <StickerPicker
            onSelect={(sticker) => {
              onSelect(sticker);
              setShowPicker(false);
              buttonRef.current?.focus();
            }}
            onClose={() => {
              setShowPicker(false);
              buttonRef.current?.focus();
            }}
          />
        </div>
      )}
    </>
  );
};


// ============================================
// NOTES:
// ============================================
// 1. Always import: import StickerPicker from './StickerPicker';
// 2. Install lucide-react if needed: npm install lucide-react
// 3. Context options: 'message', 'comment', 'story', 'flash'
// 4. Sticker object: { id, content, tags }
// 5. Test on mobile for responsive behavior
// 6. Consider adding loading states for better UX
// 7. Handle errors gracefully
