import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from '../components/TypingIndicator';
import MediaViewer from '../components/MediaViewer';
import './GroupChat.css';

export default function GroupChat({ user, userProfile }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [showMuteMenu, setShowMuteMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteUntil, setMuteUntil] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user || !groupId) return;
    
    fetchGroupData();
    fetchMessages();
    subscribeToMessages();
    resetUnreadCount();
  }, [user, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchGroupData = async () => {
    try {
      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profile:user_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Check if current user has muted this group
      const currentMember = membersData?.find(m => m.user_id === user.id);
      if (currentMember) {
        const mutedUntil = currentMember.muted_until;
        if (mutedUntil && new Date(mutedUntil) > new Date()) {
          setIsMuted(true);
          setMuteUntil(new Date(mutedUntil));
        }
        setUnreadCount(currentMember.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:sender_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_verified')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = { ...payload.new, sender };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const resetUnreadCount = async () => {
    try {
      await supabase.rpc('reset_group_unread_count', {
        p_group_id: groupId,
        p_user_id: user.id
      });
      setUnreadCount(0);
    } catch (error) {
      console.error('Error resetting unread count:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMuteGroup = async (hours) => {
    try {
      await supabase.rpc('toggle_group_mute', {
        p_group_id: groupId,
        p_user_id: user.id,
        p_duration_hours: hours
      });

      if (hours) {
        setIsMuted(true);
        setMuteUntil(new Date(Date.now() + hours * 60 * 60 * 1000));
      } else {
        setIsMuted(false);
        setMuteUntil(null);
      }
      
      setShowMuteMenu(false);
    } catch (error) {
      console.error('Error muting group:', error);
      alert('Failed to update mute settings');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const isAdmin = () => {
    const currentMember = members.find(m => m.user_id === user.id);
    return currentMember?.role === 'admin';
  };

  if (loading) {
    return (
      <div className="group-chat-loading">
        <div className="spinner"></div>
        <p>Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-chat-error">
        <h2>Group not found</h2>
        <button onClick={() => navigate('/messages')}>Back to Messages</button>
      </div>
    );
  }

  return (
    <div className="group-chat-page">
      {/* Header */}
      <div className="group-chat-header">
        <button className="back-btn" onClick={() => navigate('/messages')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="group-info" onClick={() => setShowGroupInfo(true)}>
          <img
            src={group.avatar_url || `https://ui-avatars.com/api/?name=${group.name}`}
            alt={group.name}
          />
          <div>
            <h3>{group.name}</h3>
            <p>{members.length} members</p>
          </div>
        </div>

        <div className="header-actions">
          {isMuted && (
            <span className="muted-indicator" title={`Muted until ${muteUntil?.toLocaleString()}`}>
              🔕
            </span>
          )}
          <button className="icon-btn" onClick={() => setShowMuteMenu(!showMuteMenu)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* Mute Menu */}
        <AnimatePresence>
          {showMuteMenu && (
            <motion.div
              className="mute-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isMuted ? (
                <button onClick={() => handleMuteGroup(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Unmute
                </button>
              ) : (
                <>
                  <button onClick={() => handleMuteGroup(1)}>
                    🔕 Mute for 1 hour
                  </button>
                  <button onClick={() => handleMuteGroup(8)}>
                    🔕 Mute for 8 hours
                  </button>
                  <button onClick={() => handleMuteGroup(24)}>
                    🔕 Mute for 1 day
                  </button>
                  <button onClick={() => handleMuteGroup(168)}>
                    🔕 Mute for 1 week
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender_id === user.id;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
            const showName = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
            
            return (
              <motion.div
                key={msg.id}
                className={`message ${isOwn ? 'own' : 'other'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {showAvatar && !isOwn && (
                  <img 
                    src={msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${msg.sender?.username}`} 
                    alt={msg.sender?.username}
                    className="message-avatar"
                  />
                )}
                <div className={`message-bubble ${!showAvatar && !isOwn ? 'no-avatar' : ''}`}>
                  {showName && !isOwn && (
                    <div className="message-sender">
                      <span className="sender-name">{msg.sender?.full_name || msg.sender?.username}</span>
                      {msg.sender?.is_verified && (
                        <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </div>
                  )}
                  {msg.media_url ? (
                    <div
                      className="message-media"
                      onClick={() => setViewingMedia({ url: msg.media_url, type: msg.message_type })}
                    >
                      {msg.message_type === 'video' ? (
                        <video src={msg.media_url} />
                      ) : (
                        <img src={msg.media_url} alt="Media" />
                      )}
                      <div className="media-overlay">
                        <span>{msg.message_type === 'video' ? '▶️' : '🔍'}</span>
                      </div>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  <span className="message-time">{formatTime(msg.created_at)}</span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className="message-input-container" onSubmit={sendMessage}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="send-btn" disabled={!newMessage.trim() || sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Media Viewer */}
      {viewingMedia && (
        <MediaViewer
          media={viewingMedia}
          onClose={() => setViewingMedia(null)}
        />
      )}
    </div>
  );
}
