import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactionPicker from '../components/ReactionPicker';
import MediaPreview from '../components/MediaPreview';
import MediaViewer from '../components/MediaViewer';
import ActivityStatus from '../components/ActivityStatus';
import TypingIndicator from '../components/TypingIndicator';
import VoiceRecorder from '../components/VoiceRecorder';
import AudioPlayer from '../components/AudioPlayer';
import CreateGroupModal from '../modals/CreateGroupModal';
import GroupChatList from '../components/GroupChatList';
import './Messages.css';

export default function Messages({ user, userProfile }) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch chat list
  useEffect(() => {
    if (!user) return;
    fetchChatList();
  }, [user]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (chatId && user) {
      fetchMessages(chatId);
      subscribeToMessages(chatId);
      subscribeToTyping(chatId);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [chatId, user]);

  // Fetch reactions for all messages
  useEffect(() => {
    if (messages.length > 0) {
      fetchReactions();
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when window is focused
  useEffect(() => {
    if (!chatId || !user) return;

    const handleFocus = async () => {
      await supabase.rpc('mark_messages_read', {
        p_chat_id: chatId,
        p_user_id: user.id
      });
    };

    window.addEventListener('focus', handleFocus);
    
    // Also mark as read when component mounts
    handleFocus();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [chatId, user]);

  const fetchChatList = async () => {
    try {
      const { data, error } = await supabase.rpc('get_chat_list', {
        user_uuid: user.id
      });

      if (error) throw error;
      setChatList(data || []);
    } catch (error) {
      console.error('Error fetching chat list:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chat_id) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, username, avatar_url)
        `)
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase.rpc('mark_messages_read', {
        p_chat_id: chat_id,
        p_user_id: user.id
      });

      // Find selected chat info
      const chat = chatList.find(c => c.chat_id === chat_id);
      setSelectedChat(chat);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = (chat_id) => {
    const subscription = supabase
      .channel(`messages:${chat_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat_id}`
        },
        async (payload) => {
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = { ...payload.new, sender };
          setMessages(prev => [...prev, newMessage]);

          // Mark as delivered if we're the receiver
          if (payload.new.receiver_id === user.id) {
            await supabase.rpc('mark_messages_delivered', {
              p_chat_id: chat_id,
              p_user_id: user.id
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat_id}`
        },
        async (payload) => {
          // Update message in state (for read receipts and delivery status)
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id 
              ? { ...msg, ...payload.new }
              : msg
          ));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      const channel = supabase.channel(`chat-typing-${chatId}`);
      await channel.track({ 
        user_id: user.id, 
        typing: false,
        online_at: new Date().toISOString()
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat.other_user_id,
          chat_id: chatId,
          text: newMessage.trim()
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

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_query: query.trim(),
        page_size: 20
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startNewChat = (otherUser) => {
    const chat_id = [user.id, otherUser.id].sort().join('_');
    navigate(`/messages/${chat_id}`);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const fetchReactions = async () => {
    try {
      const messageIds = messages.map(m => m.id);
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*, profiles:user_id(username, avatar_url)')
        .in('message_id', messageIds);

      if (error) throw error;

      // Group by message_id
      const grouped = {};
      data?.forEach(reaction => {
        if (!grouped[reaction.message_id]) {
          grouped[reaction.message_id] = [];
        }
        grouped[reaction.message_id].push(reaction);
      });

      setMessageReactions(grouped);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      // Check if already reacted with this emoji
      const existing = messageReactions[messageId]?.find(
        r => r.user_id === user.id && r.emoji === emoji
      );

      if (existing) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji
          });
      }

      fetchReactions();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    setSelectedMedia(file);
  };

  const handleSendMedia = async () => {
    if (!selectedMedia) return;

    try {
      // Upload to Supabase Storage
      const fileExt = selectedMedia.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucketName = selectedMedia.type.startsWith('video/') ? 'dm-videos' : 'dm-photos';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, selectedMedia);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Send message with media
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedChat.other_user_id,
        chat_id: chatId,
        media_url: publicUrl,
        media_type: selectedMedia.type.startsWith('video/') ? 'video' : 'image',
        text: null
      });

      setSelectedMedia(null);
    } catch (error) {
      console.error('Error sending media:', error);
      alert('Failed to send media');
    }
  };

  const subscribeToTyping = (chat_id) => {
    const channel = supabase.channel(`chat-typing-${chat_id}`, {
      config: { 
        presence: { 
          key: user.id 
        },
        broadcast: {
          self: false
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let isTyping = false;
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (presence.user_id !== user.id && presence.typing === true) {
              isTyping = true;
            }
          });
        });
        
        setOtherUserTyping(isTyping);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0];
        if (presence.user_id !== user.id && presence.typing === true) {
          setOtherUserTyping(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const presence = leftPresences[0];
        if (presence.user_id !== user.id) {
          setOtherUserTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            typing: false,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTyping = async (e) => {
    setNewMessage(e.target.value);

    // Only send typing indicator if there's text
    if (e.target.value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        const channel = supabase.channel(`chat-typing-${chatId}`);
        await channel.track({ 
          user_id: user.id, 
          typing: true,
          online_at: new Date().toISOString()
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator after 3 seconds
      typingTimeoutRef.current = setTimeout(async () => {
        setIsTyping(false);
        const channel = supabase.channel(`chat-typing-${chatId}`);
        await channel.track({ 
          user_id: user.id, 
          typing: false,
          online_at: new Date().toISOString()
        });
      }, 3000);
    } else {
      // If input is empty, immediately stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        const channel = supabase.channel(`chat-typing-${chatId}`);
        await channel.track({ 
          user_id: user.id, 
          typing: false,
          online_at: new Date().toISOString()
        });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleVoiceRecording = async (audioBlob, duration) => {
    try {
      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      // Send message
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedChat.other_user_id,
        chat_id: chatId,
        media_url: publicUrl,
        media_type: 'voice',
        voice_duration: duration,
        text: null
      });

      setShowVoiceRecorder(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to send voice message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      if (deleteForEveryone) {
        // Delete for everyone - set deleted_at timestamp
        const { error } = await supabase
          .from('messages')
          .update({ 
            deleted_at: new Date().toISOString(),
            text: null,
            media_url: null,
            media_type: null
          })
          .eq('id', messageId)
          .eq('sender_id', user.id); // Only sender can delete for everyone

        if (error) throw error;

        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, deleted_at: new Date().toISOString(), text: null, media_url: null, media_type: null }
            : msg
        ));
      } else {
        // Delete for me only
        const message = messages.find(m => m.id === messageId);
        const isOwn = message.sender_id === user.id;

        const { error } = await supabase
          .from('messages')
          .update({ 
            [isOwn ? 'deleted_for_sender' : 'deleted_for_receiver']: true
          })
          .eq('id', messageId);

        if (error) throw error;

        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }

      setShowDeleteMenu(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const getMessageStatus = (msg) => {
    if (msg.sender_id !== user.id) return null; // Only show status for own messages
    
    if (msg.read_at) {
      return { icon: '✓✓', color: '#0095f6', label: 'Read' };
    } else if (msg.delivered_at) {
      return { icon: '✓✓', color: '#8e8e8e', label: 'Delivered' };
    } else {
      return { icon: '✓', color: '#8e8e8e', label: 'Sent' };
    }
  };

  if (loading) {
    return (
      <div className="messages-loading">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messages-page">
      {/* Chat List Sidebar */}
      <div className={`chat-list-sidebar ${chatId ? 'hidden-mobile' : ''}`}>
        <div className="chat-list-header">
          <h1>{userProfile?.username || 'Messages'}</h1>
          <div className="header-actions">
            <button className="new-message-btn" onClick={() => setShowSearch(true)} title="New Message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button className="new-group-btn" onClick={() => setShowCreateGroup(true)} title="Create Group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Group Chats */}
        <GroupChatList user={user} />

        <div className="chat-list">
          {chatList.length === 0 ? (
            <div className="empty-chat-list">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3>No messages yet</h3>
              <p>Start a conversation with someone</p>
            </div>
          ) : (
            chatList.map((chat) => (
              <motion.div
                key={chat.chat_id}
                className={`chat-item ${chatId === chat.chat_id ? 'active' : ''}`}
                onClick={() => navigate(`/messages/${chat.chat_id}`)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4 }}
              >
                <div className="chat-avatar">
                  <img 
                    src={chat.avatar_url || `https://ui-avatars.com/api/?name=${chat.username}`} 
                    alt={chat.username} 
                  />
                  {chat.unread_count > 0 && (
                    <span className="unread-badge">{chat.unread_count}</span>
                  )}
                </div>
                
                <div className="chat-info">
                  <div className="chat-header">
                    <h3>{chat.full_name || chat.username}</h3>
                    <span className="chat-time">{formatTime(chat.last_message_time)}</span>
                  </div>
                  <p className={`last-message ${chat.unread_count > 0 ? 'unread' : ''}`}>
                    {chat.last_message || 'No messages yet'}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`chat-window ${!chatId ? 'hidden-mobile' : ''}`}>
        {!chatId ? (
          <div className="no-chat-selected">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2>Your Messages</h2>
            <p>Send private messages to your contacts</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-window-header">
              <button className="back-btn" onClick={() => navigate('/messages')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="chat-user-info" onClick={() => navigate(`/profile/${selectedChat?.username}`)}>
                <img
                  src={selectedChat?.avatar_url || `https://ui-avatars.com/api/?name=${selectedChat?.username}`}
                  alt={selectedChat?.username}
                />
                <div>
                  <h3>{selectedChat?.full_name || selectedChat?.username}</h3>
                  <ActivityStatus userId={selectedChat?.other_user_id} showText />
                </div>
              </div>

              <div className="chat-actions">
                <button className="icon-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="icon-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {otherUserTyping && (
                <TypingIndicator username={selectedChat?.username} />
              )}

              {messages.length === 0 ? (
                <div className="empty-messages">
                  <p>No messages yet. Say hi! 👋</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user.id;
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                  
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
                      <div className={`message-bubble ${!showAvatar && !isOwn ? 'no-avatar' : ''} ${msg.deleted_at ? 'deleted' : ''}`}>
                        {msg.deleted_at ? (
                          <p className="deleted-message">
                            <span>🚫</span> This message was deleted
                          </p>
                        ) : msg.media_type === 'voice' ? (
                          <AudioPlayer
                            audioUrl={msg.media_url}
                            duration={msg.voice_duration || 0}
                          />
                        ) : msg.media_url ? (
                          <div
                            className="message-media"
                            onClick={() => setViewingMedia({ url: msg.media_url, type: msg.media_type })}
                          >
                            {msg.media_type === 'video' ? (
                              <video src={msg.media_url} />
                            ) : (
                              <img src={msg.media_url} alt="Media" />
                            )}
                            <div className="media-overlay">
                              <span>{msg.media_type === 'video' ? '▶️' : '🔍'}</span>
                            </div>
                          </div>
                        ) : (
                          <p>{msg.text}</p>
                        )}
                        {!msg.deleted_at && (
                          <>
                            <div className="message-footer">
                              <span className="message-time">{formatMessageTime(msg.created_at)}</span>
                              {isOwn && getMessageStatus(msg) && (
                                <span 
                                  className="message-status" 
                                  style={{ color: getMessageStatus(msg).color }}
                                  title={getMessageStatus(msg).label}
                                >
                                  {getMessageStatus(msg).icon}
                                </span>
                              )}
                            </div>
                            <div className="message-actions">
                              <button
                                className="reaction-btn"
                                onClick={() => setShowReactionPicker(msg.id)}
                              >
                                ➕
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => setShowDeleteMenu(msg.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {messageReactions[msg.id] && messageReactions[msg.id].length > 0 && (
                        <div className="message-reactions">
                          {Object.entries(
                            messageReactions[msg.id].reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              className="reaction-display"
                              onClick={() => handleReaction(msg.id, emoji)}
                            >
                              {emoji} {count > 1 && <span>{count}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className="message-input-container" onSubmit={sendMessage}>
              <button
                type="button"
                className="media-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                style={{ display: 'none' }}
              />

              <input
                ref={inputRef}
                type="text"
                placeholder="Message..."
                value={newMessage}
                onChange={handleTyping}
                disabled={sending}
              />

              <button
                type="button"
                className="voice-btn"
                onClick={() => setShowVoiceRecorder(true)}
              >
                🎤
              </button>

              <button type="submit" className="send-btn" disabled={!newMessage.trim() || sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="search-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              className="search-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="search-header">
                <h2>New Message</h2>
                <button onClick={() => setShowSearch(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="search-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  autoFocus
                />
              </div>

              <div className="search-results">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="search-result-item"
                    onClick={() => startNewChat(user)}
                  >
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`} alt={user.username} />
                    <div>
                      <h4>{user.full_name || user.username}</h4>
                      <p>@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction Picker Modal */}
      <AnimatePresence>
        {showReactionPicker && (
          <ReactionPicker
            onSelect={(emoji) => handleReaction(showReactionPicker, emoji)}
            onClose={() => setShowReactionPicker(null)}
          />
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <MediaPreview
            file={selectedMedia}
            onRemove={() => setSelectedMedia(null)}
            onSend={handleSendMedia}
          />
        )}
      </AnimatePresence>

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {viewingMedia && (
          <MediaViewer
            mediaUrl={viewingMedia.url}
            mediaType={viewingMedia.type}
            onClose={() => setViewingMedia(null)}
          />
        )}
      </AnimatePresence>

      {/* Voice Recorder Modal */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Message Menu */}
      <AnimatePresence>
        {showDeleteMenu && (
          <motion.div
            className="delete-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteMenu(null)}
          >
            <motion.div
              className="delete-menu"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Message</h3>
              <p>Choose how you want to delete this message</p>
              
              <div className="delete-options">
                <button
                  className="delete-option"
                  onClick={() => handleDeleteMessage(showDeleteMenu, false)}
                >
                  <span className="option-icon">👤</span>
                  <div className="option-text">
                    <strong>Delete for me</strong>
                    <small>This message will be removed from your chat</small>
                  </div>
                </button>

                {messages.find(m => m.id === showDeleteMenu)?.sender_id === user.id && (
                  <button
                    className="delete-option delete-everyone"
                    onClick={() => handleDeleteMessage(showDeleteMenu, true)}
                  >
                    <span className="option-icon">👥</span>
                    <div className="option-text">
                      <strong>Delete for everyone</strong>
                      <small>This message will be removed for all participants</small>
                    </div>
                  </button>
                )}
              </div>

              <button className="cancel-delete" onClick={() => setShowDeleteMenu(null)}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          user={user}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(group) => {
            setShowCreateGroup(false);
            // Navigate to the group chat
            navigate(`/group/${group.id}`);
          }}
        />
      )}
    </div>
  );
}
