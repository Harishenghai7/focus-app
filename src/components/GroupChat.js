import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './GroupChat.css';

export default function GroupChat({ groupId, user, onBack }) {
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (groupId && user) {
      fetchGroupData();
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [groupId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchGroupData = async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:user_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);
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
          sender:sender_id(id, username, full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`group_${groupId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          fetchMessages(); // Refetch to get sender info
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const leaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        onBack();
      } catch (error) {
        console.error('Error leaving group:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="group-chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading group chat...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-chat-error">
        <h3>Group not found</h3>
        <button onClick={onBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="group-chat">
      {/* Header */}
      <div className="group-header">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        
        <div className="group-info" onClick={() => setShowMembers(true)}>
          <div className="group-avatar">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt={group.name} />
            ) : (
              <div className="group-avatar-placeholder">
                {group.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="group-details">
            <h3>{group.name}</h3>
            <p>{members.length} members</p>
          </div>
        </div>

        <div className="group-actions">
          <button 
            className="action-btn"
            onClick={() => setShowMembers(true)}
          >
            👥
          </button>
          <button 
            className="action-btn"
            onClick={leaveGroup}
          >
            🚪
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showDate = !prevMessage || 
            formatDate(message.created_at) !== formatDate(prevMessage.created_at);
          const isOwn = message.sender_id === user.id;

          return (
            <div key={message.id}>
              {showDate && (
                <div className="date-separator">
                  {formatDate(message.created_at)}
                </div>
              )}
              
              <motion.div
                className={`message ${isOwn ? 'own' : 'other'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {!isOwn && (
                  <img 
                    src={message.sender.avatar_url || `https://ui-avatars.com/api/?name=${message.sender.username}`}
                    alt={message.sender.username}
                    className="message-avatar"
                  />
                )}
                
                <div className="message-content">
                  {!isOwn && (
                    <div className="message-sender">
                      {message.sender.full_name || message.sender.username}
                    </div>
                  )}
                  <div className="message-bubble">
                    <p>{message.content}</p>
                    <span className="message-time">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className="message-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button 
          type="submit" 
          className="send-btn"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>

      {/* Members Modal */}
      <AnimatePresence>
        {showMembers && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMembers(false)}
          >
            <motion.div 
              className="members-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Group Members</h3>
                <button onClick={() => setShowMembers(false)}>×</button>
              </div>
              
              <div className="members-list">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="member-item"
                    onClick={() => {
                      setShowMembers(false);
                      navigate(`/profile/${member.user.username}`);
                    }}
                  >
                    <img 
                      src={member.user.avatar_url || `https://ui-avatars.com/api/?name=${member.user.username}`}
                      alt={member.user.username}
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <h4>
                        {member.user.full_name || member.user.username}
                        {member.user.is_verified && <span className="verified">✓</span>}
                      </h4>
                      <p>@{member.user.username}</p>
                      {member.role === 'admin' && (
                        <span className="admin-badge">Admin</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}