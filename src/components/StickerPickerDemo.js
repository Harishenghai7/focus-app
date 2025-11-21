import React, { useState } from 'react';
import StickerPicker from './StickerPicker';
import { X } from 'lucide-react';
// Sticker icon from lucide-react - keeping as it's a specialized icon
import { Sticker } from 'lucide-react';
import './StickerPickerDemo.css';

/**
 * StickerPickerDemo
 * Demo page showing all StickerPicker features and usage examples
 */
const StickerPickerDemo = () => {
  // Demo 1: Message Input
  const [message, setMessage] = useState('');
  const [showMessageStickers, setShowMessageStickers] = useState(false);

  // Demo 2: Comment Box
  const [comment, setComment] = useState('');
  const [showCommentStickers, setShowCommentStickers] = useState(false);

  // Demo 3: Story Editor
  const [storyStickers, setStoryStickers] = useState([]);
  const [showStoryPicker, setShowStoryPicker] = useState(false);

  // Demo 4: Recent & Favorites Display
  const [selectedStickers, setSelectedStickers] = useState([]);

  const handleAddStorySticker = (sticker) => {
    setStoryStickers([...storyStickers, {
      id: Date.now(),
      content: sticker.content,
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
    }]);
  };

  const removeStorySticker = (id) => {
    setStoryStickers(storyStickers.filter(s => s.id !== id));
  };

  return (
    <div className="sticker-demo">
      <header className="demo-header">
        <h1>🎨 Sticker Picker System</h1>
        <p>Interactive demos showing all features and usage patterns</p>
      </header>

      <div className="demo-grid">
        {/* Demo 1: Chat/Message Input */}
        <section className="demo-card">
          <h2>💬 Chat Message</h2>
          <p className="demo-description">
            Add stickers to chat messages. Try searching, favorites, and recents!
          </p>
          
          <div className="message-input-demo">
            <div className="input-wrapper">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="demo-input"
              />
              <button
                onClick={() => setShowMessageStickers(!showMessageStickers)}
                className="sticker-btn"
                title="Add sticker"
              >
                <Sticker size={20} />
              </button>
            </div>

            {showMessageStickers && (
              <div className="sticker-picker-wrapper">
                <StickerPicker
                  onSelect={(sticker) => {
                    setMessage(prev => prev + sticker.content);
                    setSelectedStickers([...selectedStickers, sticker]);
                  }}
                  onClose={() => setShowMessageStickers(false)}
                  context="message"
                />
              </div>
            )}

            {message && (
              <div className="message-preview">
                <strong>Preview:</strong> {message}
              </div>
            )}
          </div>
        </section>

        {/* Demo 2: Comment Box */}
        <section className="demo-card">
          <h2>💭 Comments</h2>
          <p className="demo-description">
            Add stickers to comments on posts
          </p>
          
          <div className="comment-demo">
            <div className="fake-post">
              <div className="post-image">📸</div>
              <p>Amazing sunset! 🌅</p>
            </div>

            <div className="comment-box">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="demo-textarea"
                rows={3}
              />
              
              <div className="comment-actions">
                <button
                  onClick={() => setShowCommentStickers(!showCommentStickers)}
                  className="sticker-btn-text"
                >
                  🎨 Add Sticker
                </button>
                <button className="post-btn">Post</button>
              </div>

              {showCommentStickers && (
                <div className="sticker-modal-overlay" onClick={() => setShowCommentStickers(false)}>
                  <div className="sticker-modal" onClick={(e) => e.stopPropagation()}>
                    <StickerPicker
                      onSelect={(sticker) => {
                        setComment(prev => prev + ' ' + sticker.content);
                        setShowCommentStickers(false);
                      }}
                      onClose={() => setShowCommentStickers(false)}
                      context="comment"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Demo 3: Story Editor */}
        <section className="demo-card">
          <h2>📸 Story/Flash Editor</h2>
          <p className="demo-description">
            Place stickers on stories and flashes
          </p>
          
          <div className="story-editor-demo">
            <div className="story-canvas">
              <div className="story-bg">
                <span className="story-placeholder">Your Story Image</span>
              </div>
              
              {storyStickers.map(sticker => (
                <div
                  key={sticker.id}
                  className="placed-sticker"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                  }}
                >
                  <span className="sticker-content">{sticker.content}</span>
                  <button
                    className="remove-sticker"
                    onClick={() => removeStorySticker(sticker.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="story-toolbar">
              <button
                onClick={() => setShowStoryPicker(true)}
                className="toolbar-btn"
              >
                <Sticker size={18} />
                Add Sticker
              </button>
              <button className="toolbar-btn primary">Share Story</button>
            </div>

            {showStoryPicker && (
              <div className="sticker-modal-overlay" onClick={() => setShowStoryPicker(false)}>
                <div className="sticker-modal" onClick={(e) => e.stopPropagation()}>
                  <StickerPicker
                    onSelect={(sticker) => {
                      handleAddStorySticker(sticker);
                      setShowStoryPicker(false);
                    }}
                    onClose={() => setShowStoryPicker(false)}
                    context="story"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Demo 4: Features Showcase */}
        <section className="demo-card features">
          <h2>✨ Features</h2>
          
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">😀</span>
              <div>
                <strong>4 Sticker Packs</strong>
                <p>Emoji Reactions, Focus Brand, Festivals, Trending</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <div>
                <strong>Smart Search</strong>
                <p>Search across all packs with tag matching</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <div>
                <strong>Favorites</strong>
                <p>Star your favorite stickers for quick access</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🕐</span>
              <div>
                <strong>Recently Used</strong>
                <p>Last 10 stickers you've used</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <div>
                <strong>Responsive</strong>
                <p>Works perfectly on all screen sizes</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🌙</span>
              <div>
                <strong>Dark Mode</strong>
                <p>Automatic theme detection</p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo 5: Recently Selected */}
        <section className="demo-card">
          <h2>📊 Your Activity</h2>
          <p className="demo-description">
            Stickers you've selected in this demo session
          </p>
          
          <div className="selected-stickers">
            {selectedStickers.length > 0 ? (
              <div className="sticker-list">
                {selectedStickers.slice(-10).reverse().map((sticker, index) => (
                  <div key={index} className="selected-sticker-item">
                    <span className="sticker-display">{sticker.content}</span>
                    <span className="sticker-tags">{sticker.tags.join(', ')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Select some stickers to see them here!</p>
              </div>
            )}
          </div>
        </section>

        {/* Demo 6: Integration Guide */}
        <section className="demo-card guide">
          <h2>🚀 Quick Start</h2>
          
          <div className="code-example">
            <h3>1. Import</h3>
            <pre><code>{`import StickerPicker from './components/StickerPicker';
import { Sticker } from 'lucide-react';`}</code></pre>

            <h3>2. Add State</h3>
            <pre><code>{`const [showStickers, setShowStickers] = useState(false);
const [message, setMessage] = useState('');`}</code></pre>

            <h3>3. Use Component</h3>
            <pre><code>{`<StickerPicker
  onSelect={(sticker) => setMessage(prev => prev + sticker.content)}
  onClose={() => setShowStickers(false)}
  context="message"
/>`}</code></pre>
          </div>

          <div className="guide-links">
            <a href="#" className="guide-link">📖 Full Documentation</a>
            <a href="#" className="guide-link">💻 Code Examples</a>
            <a href="#" className="guide-link">🎨 Customization Guide</a>
          </div>
        </section>
      </div>

      <footer className="demo-footer">
        <p>Built with ❤️ for Focus App</p>
        <p>
          <strong>80+</strong> stickers across <strong>4</strong> packs
        </p>
      </footer>
    </div>
  );
};

export default StickerPickerDemo;
