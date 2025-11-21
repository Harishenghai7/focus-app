import React from 'react';
import PropTypes from 'prop-types';
import './ChatWindow.css';

/**
 * ChatWindow Component
 * Live chat sidebar for streams
 */
const ChatWindow = ({
  messages = [],
  onSendMessage,
  newMessage,
  setNewMessage,
  currentUser,
  chatEndRef
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSendMessage) {
      onSendMessage(e);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Live Chat</h3>
        <span className="chat-count">{messages.length} messages</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <i className="far fa-comments"></i>
            <p>No messages yet. Be the first to say hi!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`chat-message ${
                  msg.user?.id === currentUser?.id ? 'own-message' : ''
                }`}
              >
                <div className="message-header">
                  <img
                    src={msg.user?.avatar_url || '/default-avatar.png'}
                    alt={msg.user?.username}
                    className="message-avatar"
                  />
                  <span className="message-username">{msg.user?.username || 'Unknown'}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Send a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          maxLength={200}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!newMessage.trim()}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

ChatWindow.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      message: PropTypes.string.isRequired,
      user: PropTypes.shape({
        id: PropTypes.string,
        username: PropTypes.string,
        avatar_url: PropTypes.string
      })
    })
  ),
  onSendMessage: PropTypes.func,
  newMessage: PropTypes.string,
  setNewMessage: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  chatEndRef: PropTypes.object
};

export default ChatWindow;
