import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaViewer from '../components/MediaViewer';
import MessageInput from '../components/MessageInput';
import MemberCard from '../components/MemberCard';
import Layout from '../components/Layout/Layout';
import { useMessages } from '../hooks/useMessages';
import { formatDate, formatTime } from '../utils/dateFormatter';
import './GroupChat.css';

export default function GroupChat({ user, userProfile }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [showMuteMenu, setShowMuteMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteUntil, setMuteUntil] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const messagesEndRef = useRef(null);
  const messageChannel = useRef(null);

  // Use the useMessages hook for group messages
  const { 
    messages, 
    loading: messagesLoading, 
    sendMessage: sendTextMessage,
    sendMediaMessage 
  } = useMessages(groupId, user?.id, 'group');

  useEffect(() => {
    if (!user || !groupId) return;
    
    fetchGroupData();
    resetUnreadCount();

    return () => {
      if (messageChannel.current) {
        messageChannel.current.unsubscribe();
      }
    };
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

  const handleSendMessage = async (content) => {
    try {
      await sendTextMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleSendVoice = async (blob, duration) => {
    try {
      await sendMediaMessage(blob, 'voice', { duration });
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to send voice message');
    }
  };

  const handleSendFile = async (file) => {
    try {
      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'file';
      await sendMediaMessage(file, type);
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file');
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

  const isAdmin = () => {
    const currentMember = members.find(m => m.user_id === user.id);
    return currentMember?.role === 'admin';
  };

  const handleAddMember = () => {
    setShowAddMember(true);
  };

  const handleRemoveMember = async (member) => {
    if (window.confirm(`Remove ${member.profile?.full_name || member.profile?.username} from this group?`)) {
      try {
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', member.user_id);

        if (error) throw error;

        setMembers(prev => prev.filter(m => m.user_id !== member.user_id));
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        if (error) throw error;

        navigate('/messages');
      } catch (error) {
        console.error('Error leaving group:', error);
        alert('Failed to leave group');
      }
    }
  };

  const handleMakeAdmin = async (member) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', member.user_id);

      if (error) throw error;

      setMembers(prev => prev.map(m => 
        m.user_id === member.user_id ? { ...m, role: 'admin' } : m
      ));
      alert('Member promoted to admin');
    } catch (error) {
      console.error('Error making admin:', error);
      alert('Failed to update member role');
    }
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
    <Layout layoutType="chat">
      <div className="group-chat-page">
        {/* Header */}
        <div className="group-chat-header">
          <button className="back-btn" onClick={() => navigate('/messages')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="group-info" onClick={() => navigate(`/group-settings/${groupId}`)}>
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
            <button 
              className="icon-btn" 
              onClick={() => setShowMembersSidebar(!showMembersSidebar)}
              title="View Members"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button 
              className="icon-btn" 
              onClick={() => navigate(`/group-settings/${groupId}`)}
              title="Group Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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
      <MessageInput
        onSend={handleSendMessage}
        onVoiceSend={handleSendVoice}
        onFileSend={handleSendFile}
        disabled={messagesLoading}
      />

      {/* Members Sidebar */}
      <AnimatePresence>
        {showMembersSidebar && (
          <motion.div
            className="members-sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="sidebar-header">
              <h3>Members ({members.length})</h3>
              <button onClick={() => setShowMembersSidebar(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {isAdmin() && (
              <button className="add-member-btn" onClick={handleAddMember}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Member
              </button>
            )}

            <div className="members-list">
              {members.map(member => (
                <MemberCard
                  key={member.user_id}
                  member={member}
                  isAdmin={member.role === 'admin'}
                  canRemove={isAdmin() && member.user_id !== user.id}
                  onRemove={handleRemoveMember}
                  onMakeAdmin={handleMakeAdmin}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Viewer */}
      {viewingMedia && (
        <MediaViewer
          media={viewingMedia}
          onClose={() => setViewingMedia(null)}
        />
      )}
      </div>
    </Layout>
  );
}
