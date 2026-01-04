import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './LiveStreamPlayer.module.css';

/**
 * LiveStreamPlayer
 * Real-time live stream viewer with chat.
 * @param {string} streamUrl - Live stream URL
 * @param {Array<{user:string, message:string}>} chat - Chat messages
 * @example <LiveStreamPlayer streamUrl="..." chat={[{user:'alice',message:'Hi'}]} />
 */
const LiveStreamPlayer = ({ streamUrl, chat }) => {
  const [message, setMessage] = useState('');
  const handleSend = () => {
    // Placeholder: Add message to chat
    setMessage('');
  };
  return (
    <div className={styles.container}>
      <video src={streamUrl} controls className={styles.video} />
      <div className={styles.chat}>
        <ul className={styles.messages}>
          {chat.map((c, i) => (
            <li key={i} className={styles.message}><b>{c.user}:</b> {c.message}</li>
          ))}
        </ul>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a message..."
            aria-label="Chat input"
          />
          <button className={styles.sendBtn} onClick={handleSend} aria-label="Send message">Send</button>
        </div>
      </div>
    </div>
  );
};

LiveStreamPlayer.propTypes = {
  streamUrl: PropTypes.string.isRequired,
  chat: PropTypes.arrayOf(PropTypes.shape({
    user: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired
  })).isRequired
};

export default React.memo(LiveStreamPlayer);
