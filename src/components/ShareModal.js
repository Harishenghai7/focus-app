import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardNavigation, useFocusManagement } from '../hooks/useKeyboardNavigation';
import './ShareModal.css';

export default function ShareModal({ post, user, onClose, isOpen, contentData, onShare }) {
  // Support both old and new prop structures
  const content = post || contentData;
  const handleClose = onClose;
  
  const [shareType, setShareType] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Keyboard navigation
  const modalRef = useRef(null);
  
  // Enable keyboard navigation
  useKeyboardNavigation({
    onEscape: handleClose,
    enabled: isOpen !== false,
    trapFocus: true,
    containerRef: modalRef
  });
  
  // Focus management
  useFocusManagement(modalRef, {
    autoFocus: true,
    restoreFocus: true
  });

  React.useEffect(() => {
    if (shareType === 'dm') {
      fetchFriends();
    }
  }, [shareType]);

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles:following_id(id, username, full_name, avatar_url)
      `)
      .eq('follower_id', user.id);
    
    setFriends(data?.map(f => f.profiles) || []);
  };

  const handleShare = async (type) => {
    setLoading(true);
    try {
      // If onShare callback is provided (from InteractionBar), use it
      if (onShare) {
        const success = await onShare(type);
        if (success) {
          setMessage(type === 'copy' ? 'Link copied!' : 'Shared successfully!');
          setTimeout(() => handleClose(), 1500);
        }
        return;
      }

      // Otherwise use legacy sharing logic
      if (type === 'dm' && selectedFriends.length > 0) {
        // Share to selected friends
        for (const friendId of selectedFriends) {
          const chatId = [user.id, friendId].sort().join('_');
          
          await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: friendId,
            chat_id: chatId,
            text: `Shared a post: ${window.location.origin}/post/${content.id}`
          });

          await supabase.from('shares').insert({
            user_id: user.id,
            content_type: 'post',
            content_id: content.id,
            share_type: 'dm',
            shared_to: friendId
          });
        }
        setMessage(`Shared to ${selectedFriends.length} friend(s)!`);
      } else if (type === 'story') {
        // Share to story
        await supabase.from('flash').insert({
          user_id: user.id,
          media_url: content.image_url || content.media_url,
          media_type: 'image',
          caption: `Check out this post!`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        await supabase.from('shares').insert({
          user_id: user.id,
          content_type: 'post',
          content_id: content.id,
          share_type: 'story'
        });

        setMessage('Shared to your story!');
      } else if (type === 'external' || type === 'copy') {
        // Copy link
        const url = `${window.location.origin}/post/${content.id}`;
        await navigator.clipboard.writeText(url);
        
        await supabase.from('shares').insert({
          user_id: user.id,
          content_type: 'post',
          content_id: content.id,
          share_type: 'external'
        });

        setMessage('Link copied to clipboard!');
      }

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Share error:', error);
      setMessage('Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
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

  // Don't render if not open (when using isOpen prop)
  if (isOpen === false) return null;

  return (
    <AnimatePresence>
      {(isOpen === undefined || isOpen) && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div 
            ref={modalRef}
            className="share-modal"
            role="dialog"
            aria-labelledby="share-modal-title"
            aria-modal="true"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="share-modal-title">Share Post</h3>
              <button 
                className="close-btn" 
                onClick={handleClose}
                aria-label="Close share modal"
              >
                ✕
              </button>
            </div>

        {!shareType ? (
          <div className="share-options">
            <button 
              className="share-option-btn"
              onClick={() => setShareType('dm')}
              aria-label="Send in direct message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Send in Direct</span>
            </button>

            <button 
              className="share-option-btn"
              onClick={() => handleShare('story')}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Share to Story</span>
            </button>

            <button 
              className="share-option-btn"
              onClick={() => handleShare('copy')}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy Link</span>
            </button>

            <button 
              className="share-option-btn"
              onClick={() => handleShare('twitter')}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
              <span>Share on Twitter</span>
            </button>

            <button 
              className="share-option-btn"
              onClick={() => handleShare('facebook')}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
              <span>Share on Facebook</span>
            </button>

            <button 
              className="share-option-btn"
              onClick={() => handleShare('whatsapp')}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Share on WhatsApp</span>
            </button>
          </div>
        ) : (
          <div className="share-friends">
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search friends to share with"
            />

            <div className="friends-list">
              {filteredFriends.map(friend => (
                <div 
                  key={friend.id}
                  className={`friend-item ${selectedFriends.includes(friend.id) ? 'selected' : ''}`}
                  onClick={() => toggleFriendSelection(friend.id)}
                >
                  <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} alt="" />
                  <div className="friend-info">
                    <span className="friend-username">{friend.username}</span>
                    {friend.full_name && <span className="friend-fullname">{friend.full_name}</span>}
                  </div>
                  <div className="checkbox">
                    {selectedFriends.includes(friend.id) && '✓'}
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="send-btn"
              onClick={() => handleShare('dm')}
              disabled={selectedFriends.length === 0 || loading}
            >
              {loading ? 'Sending...' : `Send to ${selectedFriends.length} friend(s)`}
            </button>
          </div>
        )}

            {message && (
              <div className="share-message">{message}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
