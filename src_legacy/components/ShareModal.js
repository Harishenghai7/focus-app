import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import useClipboard from '../hooks/useClipboard';
import styles from './ShareModal.module.css';

/**
 * Generates a QR code URL for sharing content
 * @param {string} url - URL to encode in QR code
 * @returns {string} QR code image URL
 */
const generateQRCode = (url) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

/**
 * ShareModal - Modal for sharing content via DM, copy link, external apps, and QR code
 * @component
 * @param {string} contentId - ID of content to share
 * @param {string} contentType - Type of content (post, boltz, etc)
 * @param {string} contentUrl - Custom URL or will be generated from contentId/Type
 * @param {Object} user - Current user object
 * @param {function} onClose - Handler to close modal
 * @param {boolean} isOpen - Whether modal is open
 * @returns {React.ReactElement}
 */
const ShareModal = memo(function ShareModal({ 
  contentId, 
  contentType = 'post', 
  contentUrl, 
  user, 
  onClose, 
  isOpen 
}) {
  const [shareView, setShareView] = useState('main'); // 'main', 'direct', or 'qr'
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const modalRef = useRef(null);
  const { copy } = useClipboard();

  // Generate the share URL
  const shareUrl = contentUrl || `${window.location.origin}/${contentType}/${contentId}`;

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles:following_id(id, username, full_name, avatar_url)
        `)
        .eq('follower_id', user.id);

      setFriends(data?.map(f => f.profiles).filter(p => p != null) || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [user?.id]);

  // Fetch friends when opening direct share view
  useEffect(() => {
    if (isOpen && shareView === 'direct') {
      fetchFriends();
    }
  }, [isOpen, shareView, fetchFriends]);

  const handleShareAction = async (type) => {
    // Switch views for multi-step actions
    if (type === 'direct') {
      setShareView('direct');
      return;
    }

    if (type === 'qr') {
      setShareView('qr');
      return;
    }

    setLoading(true);
    try {
      switch (type) {
        case 'copy':
          await copy(shareUrl);
          setMessage('Link copied to clipboard!');
          setTimeout(() => {
            setMessage('');
            onClose();
          }, 1500);
          break;
          
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
          setMessage('Opening Twitter...');
          setTimeout(() => onClose(), 1000);
          break;
          
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
          setMessage('Opening Facebook...');
          setTimeout(() => onClose(), 1000);
          break;
          
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
          setMessage('Opening WhatsApp...');
          setTimeout(() => onClose(), 1000);
          break;
          
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
          setMessage('Opening Telegram...');
          setTimeout(() => onClose(), 1000);
          break;
          
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
          setMessage('Opening LinkedIn...');
          setTimeout(() => onClose(), 1000);
          break;
          
        case 'email':
          window.location.href = `mailto:?subject=Check this out&body=${encodeURIComponent(shareUrl)}`;
          setMessage('Opening email...');
          setTimeout(() => onClose(), 1000);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
      setMessage('Failed to share');
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDirect = async () => {
    if (selectedFriends.length === 0 || !user?.id) return;

    setLoading(true);
    try {
      const shareText = `Check this out: ${shareUrl}`;
      
      // Send to each selected friend
      for (const friendId of selectedFriends) {
        const chatId = [user.id, friendId].sort().join('_');
        
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: friendId,
          chat_id: chatId,
          text: shareText,
          created_at: new Date().toISOString()
        });
      }

      setMessage(`Sent to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}!`);
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sending direct messages:', error);
      setMessage('Failed to send messages');
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          className={styles.shareModal}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <button 
              onClick={() => shareView !== 'main' ? setShareView('main') : onClose()} 
              className={styles.backBtn} 
              aria-label={shareView !== 'main' ? 'Go back' : 'Close modal'}
            >
              {shareView !== 'main' ? '←' : '✕'}
            </button>
            <h3>
              {shareView === 'direct' && 'Send to Friends'}
              {shareView === 'qr' && 'QR Code'}
              {shareView === 'main' && 'Share'}
            </h3>
            <div style={{ width: 32 }} />
          </div>

          {shareView === 'main' ? (
            <div className={styles.shareOptions}>
              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('direct')} 
                aria-label="Send in Direct Message"
              >
                <div className={styles.shareIcon}>💬</div>
                <span>Send in Direct</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('copy')} 
                aria-label="Copy Link to Clipboard"
                disabled={loading}
              >
                <div className={styles.shareIcon}>🔗</div>
                <span>Copy Link</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('qr')} 
                aria-label="Show QR Code"
              >
                <div className={styles.shareIcon}>�</div>
                <span>QR Code</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('whatsapp')} 
                aria-label="Share on WhatsApp"
              >
                <div className={styles.shareIcon}>�</div>
                <span>WhatsApp</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('telegram')} 
                aria-label="Share on Telegram"
              >
                <div className={styles.shareIcon}>✈️</div>
                <span>Telegram</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('twitter')} 
                aria-label="Share on Twitter"
              >
                <div className={styles.shareIcon}>🐦</div>
                <span>Twitter</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('facebook')} 
                aria-label="Share on Facebook"
              >
                <div className={styles.shareIcon}>👍</div>
                <span>Facebook</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('linkedin')} 
                aria-label="Share on LinkedIn"
              >
                <div className={styles.shareIcon}>💼</div>
                <span>LinkedIn</span>
              </button>

              <button 
                className={styles.shareOption} 
                onClick={() => handleShareAction('email')} 
                aria-label="Share via Email"
              >
                <div className={styles.shareIcon}>📧</div>
                <span>Email</span>
              </button>
            </div>
          ) : shareView === 'qr' ? (
            <div className={styles.qrSection}>
              <p className={styles.qrDescription}>Scan this QR code to share the content</p>
              <div className={styles.qrCodeContainer}>
                <img 
                  src={generateQRCode(shareUrl)} 
                  alt="QR Code for sharing" 
                  className={styles.qrCodeImage}
                />
              </div>
              <div className={styles.qrUrl}>
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  className={styles.urlInput}
                  aria-label="Share URL"
                />
                <button 
                  className={styles.copyUrlBtn} 
                  onClick={() => handleShareAction('copy')}
                  aria-label="Copy URL"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.directSection}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search friends"
              />

              <div className={styles.friendsList} role="listbox" aria-label="Friends list">
                {filteredFriends.map(friend => (
                  <div
                    key={friend.id}
                    className={`${styles.friendItem} ${selectedFriends.includes(friend.id) ? styles.friendItemSelected : ''}`}
                    onClick={() => toggleFriend(friend.id)}
                    role="option"
                    aria-selected={selectedFriends.includes(friend.id)}
                  >
                    <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} alt="" />
                    <div className={styles.friendInfo}>
                      <span className={styles.username}>{friend.username}</span>
                      {friend.full_name && <span className={styles.fullname}>{friend.full_name}</span>}
                    </div>
                    <div className={styles.checkbox}>{selectedFriends.includes(friend.id) && '✓'}</div>
                  </div>
                ))}
              </div>

              <button
                className={styles.sendBtn}
                onClick={handleSendDirect}
                disabled={selectedFriends.length === 0 || loading}
                aria-label={`Send to ${selectedFriends.length} friend(s)`}
              >
                {loading ? 'Sending...' : `Send (${selectedFriends.length})`}
              </button>
            </div>
          )}

          {message && <div className={styles.shareMessage}>{message}</div>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

ShareModal.displayName = 'ShareModal';
ShareModal.propTypes = {
  contentId: PropTypes.string.isRequired,
  contentType: PropTypes.string,
  contentUrl: PropTypes.string,
  user: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default ShareModal;
