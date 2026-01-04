import React, { useState, useEffect, useRef } from 'react';
import StickerPicker from '../components/StickerPicker/StickerPicker';
import { getStickerUrl } from '../data/focuslyStickerData';
import './MessagesStickers.css';

/**
 * Messages/Chat Component with Sticker Support
 * Allows users to send Focusly stickers in direct messages
 */

const MessagesWithStickers = ({ currentUser, chatUser, messages = [], setMessages }) => {
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handle sending text messages
   */
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setLoading(true);

      const message = {
        id: Date.now(),
        sender_id: currentUser?.id,
        receiver_id: chatUser?.id,
        message_type: 'text',
        content: messageText.trim(),
        created_at: new Date().toISOString(),
        read: false
      };

      // TODO: Save to Supabase
      // await supabase.from('messages').insert([message]);

      // Update UI
      setMessages(prev => [...prev, message]);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle sending sticker messages
   */
  const handleSendSticker = async (sticker) => {
    try {
      setLoading(true);

      const message = {
        id: Date.now(),
        sender_id: currentUser?.id,
        receiver_id: chatUser?.id,
        message_type: 'sticker',
        sticker_id: sticker.id,
        sticker_name: sticker.name,
        sticker_url: getStickerUrl(sticker.fileName),
        created_at: new Date().toISOString(),
        read: false
      };

      // TODO: Save to Supabase
      // await supabase.from('messages').insert([message]);

      // Update UI
      setMessages(prev => [...prev, message]);
      setShowStickerPicker(false);
    } catch (error) {
      console.error('Error sending sticker:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle keyboard shortcut (Enter to send)
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="messages-container">
      {/* Header */}
      <div className="messages-header">
        <div className="chat-user-info">
          <img
            src={chatUser?.avatar || '/default-avatar.png'}
            alt={chatUser?.username}
            className="chat-avatar"
          />
          <div>
            <h2 className="chat-username">{chatUser?.username}</h2>
            <p className="chat-status">Online</p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper ${
              message.sender_id === currentUser?.id ? 'sent' : 'received'
            }`}
          >
            <div className="message-bubble">
              {message.message_type === 'text' && (
                <p className="message-text">{message.content}</p>
              )}

              {message.message_type === 'sticker' && (
                <div className="message-sticker-container">
                  <img
                    src={message.sticker_url}
                    alt={message.sticker_name}
                    className="message-sticker"
                    title={message.sticker_name}
                    loading="lazy"
                  />
                </div>
              )}

              <span className="message-time">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-area">
        <div className="input-actions">
          <button
            className="action-button sticker-button"
            onClick={() => setShowStickerPicker(true)}
            title="Send Focusly Sticker"
            disabled={loading}
          >
            🦁
          </button>
        </div>

        <div className="input-wrapper">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message or send a sticker..."
            className="message-input"
            disabled={loading}
            rows="1"
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={loading || !messageText.trim()}
            title="Send message"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Sticker Picker Modal */}
      <StickerPicker
        show={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelect={handleSendSticker}
      />
    </div>
  );
};

export default MessagesWithStickers;
