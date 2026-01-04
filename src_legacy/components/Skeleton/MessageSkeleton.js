import React from 'react';
import '../styles/skeleton.css';

/**
 * MessageSkeleton - Loading skeleton for chat/message items
 * Mimics message list item structure
 * 
 * @param {boolean} isCurrentUser - Whether message is from current user (right align)
 */
export const MessageSkeleton = ({ isCurrentUser = false }) => {
  return (
    <div className={`skeleton-message ${isCurrentUser ? 'skeleton-message-right' : 'skeleton-message-left'}`}>
      {!isCurrentUser && <div className="skeleton-message-avatar"></div>}
      <div className="skeleton-message-bubble">
        <div className="skeleton-line skeleton-message-text"></div>
        <div className="skeleton-line skeleton-message-text" style={{ width: '70%' }}></div>
      </div>
      {isCurrentUser && <div className="skeleton-message-avatar"></div>}
    </div>
  );
};

/**
 * ChatListItemSkeleton - Loading skeleton for chat thread in list
 */
export const ChatListItemSkeleton = () => {
  return (
    <div className="skeleton-chat-list-item">
      {/* Avatar */}
      <div className="skeleton-avatar"></div>

      {/* Chat Info */}
      <div className="skeleton-chat-info">
        {/* Name and Time */}
        <div className="skeleton-chat-header">
          <div className="skeleton-line skeleton-chat-name"></div>
          <div className="skeleton-line skeleton-chat-time"></div>
        </div>

        {/* Last Message Preview */}
        <div className="skeleton-line skeleton-chat-preview"></div>
      </div>

      {/* Badge */}
      <div className="skeleton-chat-badge"></div>
    </div>
  );
};

/**
 * ChatListSkeleton - Multiple chat items
 */
export const ChatListSkeleton = ({ count = 5 }) => {
  return (
    <div className="skeleton-chat-list">
      {Array.from({ length: count }).map((_, i) => (
        <ChatListItemSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * ConversationSkeleton - Full conversation skeleton
 */
export const ConversationSkeleton = ({ messageCount = 5 }) => {
  return (
    <div className="skeleton-conversation">
      {/* Messages */}
      <div className="skeleton-messages">
        {Array.from({ length: messageCount }).map((_, i) => (
          <MessageSkeleton key={i} isCurrentUser={i % 2 === 0} />
        ))}
      </div>

      {/* Input Area */}
      <div className="skeleton-message-input"></div>
    </div>
  );
};

export default MessageSkeleton;
