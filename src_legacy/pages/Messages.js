import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { components, utils } from '@/importMap';
import SearchBar from '../components/SearchBar';
import OnlineIndicator from '../components/OnlineIndicator';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { useMessages } from '../hooks/useMessages';
import usePresence from '../hooks/usePresence';
import useDebounce from '../hooks/useDebounce';
import { formatDate, formatMessageTime } from '../utils/dateFormatter';
import truncateText from '../utils/data/truncateText';
import "./Messages.css";

export default function Messages({ user, userProfile }) {
  // Track page view for analytics
  useEffect(() => {
    utils.trackPageView('Messages');
  }, []);

  // Measure load time for performance
  useEffect(() => {
    const loadTime = utils.measureLoadTime();
    if (loadTime) utils.logPerformance('messages_load_time', loadTime);
  }, []);

  const [chats, setChats] = useState([]); // Renamed from conversations
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showMessageActions, setShowMessageActions] = useState(null);

  // Use custom hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { messages: hookMessages, loading: messagesLoading, sendMessage: hookSendMessage } = useMessages(
    activeConversation?.id, 
    user?.id
  );
  const userOnlineStatus = usePresence(user?.id);

  const navigate = useNavigate();
  const { conversationId } = useParams();
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mounted = useRef(true);
  const fileInputRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const messageActionsRef = useRef(null);

  const TYPING_TIMEOUT = 3000;
  const TYPING_THROTTLE = 1000;

  // Emojis for quick reactions
  const quickEmojis = ['😊', '😂', '❤️', '👍', '🔥', '😮', '😢', '🎉'];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (user) {
      fetchChats(); // Renamed from fetchConversations
      setupPresenceTracking();
    }
  }, [user?.id]);

  useEffect(() => {
    if (conversationId && user) {
      loadConversation(conversationId);
    } else {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [conversationId, user?.id]);

  // Close message actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messageActionsRef.current && !messageActionsRef.current.contains(e.target)) {
        setShowMessageActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setupPresenceTracking = useCallback(async () => {
    if (!user?.id) return;

    await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        last_seen: new Date().toISOString(),
        is_online: true
      });

    const presenceChannel = supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set(Object.keys(state).map(key => state[key][0]?.user_id));
        if (mounted.current) {
          setOnlineUsers(online);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (mounted.current && newPresences[0]?.user_id) {
          setOnlineUsers(prev => new Set([...prev, newPresences[0].user_id]));
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (mounted.current && leftPresences[0]?.user_id) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(leftPresences[0].user_id);
            return newSet;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    utils.subscriptionManager.add('presence', presenceChannel, {
      component: 'Messages',
      type: 'presence'
    });

    const heartbeatInterval = setInterval(async () => {
      if (mounted.current) {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            last_seen: new Date().toISOString(),
            is_online: true
          });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      utils.subscriptionManager.remove('presence');
      
      supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          last_seen: new Date().toISOString(),
          is_online: false
        });
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const messagesChannel = supabase
      .channel('all_messages')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          if (!mounted.current) return;

          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender: senderProfile
          };

          setChats(prev => {
            const convId = payload.new.conversation_id;
            const existingIndex = prev.findIndex(c => c.id === convId);
            
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                last_message: newMessage,
                last_message_at: payload.new.created_at,
                unread_count: activeConversation?.id === convId 
                  ? 0 
                  : (updated[existingIndex].unread_count || 0) + 1
              };
              const [conversation] = updated.splice(existingIndex, 1);
              return [conversation, ...updated];
            }
            return prev;
          });

          if (activeConversation?.id === payload.new.conversation_id) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
            
            await markMessagesAsRead(payload.new.conversation_id);
          } else {
            setUnreadCounts(prev => ({
              ...prev,
              [payload.new.conversation_id]: (prev[payload.new.conversation_id] || 0) + 1
            }));

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`${senderProfile?.full_name || senderProfile?.username}`, {
                body: payload.new.content || '📷 Photo',
                icon: senderProfile?.avatar_url
              });
            }
          }
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages'
        },
        (payload) => {
          if (!mounted.current) return;

          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
          ));
        }
      )
      .on('postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'messages'
        },
        (payload) => {
          if (!mounted.current) return;

          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    utils.subscriptionManager.add('all_messages', messagesChannel, {
      component: 'Messages',
      type: 'realtime'
    });

    return () => {
      utils.subscriptionManager.remove('all_messages');
    };
  }, [user?.id, activeConversation?.id]);

  useEffect(() => {
    if (!activeConversation?.id || !user?.id) return;

    const typingChannel = supabase
      .channel(`typing:${activeConversation.id}`)
      .on('broadcast', 
        { event: 'typing' }, 
        (payload) => {
          if (!mounted.current || payload.payload.user_id === user.id) return;

          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(payload.payload.user_id);
            return newSet;
          });

          setTimeout(() => {
            if (mounted.current) {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(payload.payload.user_id);
                return newSet;
              });
            }
          }, TYPING_TIMEOUT);
        }
      )
      .subscribe();

    utils.subscriptionManager.add(`typing:${activeConversation.id}`, typingChannel, {
      component: 'Messages',
      type: 'broadcast'
    });

    return () => {
      utils.subscriptionManager.remove(`typing:${activeConversation.id}`);
    };
  }, [activeConversation?.id, user?.id]);

  const fetchChats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all messages involving the current user
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, username, full_name, avatar_url, verified),
          receiver:profiles!receiver_id(id, username, full_name, avatar_url, verified)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      if (!mounted.current) return;

      // Group messages by conversation_id
      const chatsMap = new Map();
      messagesData.forEach(message => {
        if (!chatsMap.has(message.conversation_id)) {
          chatsMap.set(message.conversation_id, []);
        }
        chatsMap.get(message.conversation_id).push(message);
      });

      // Create chat objects
      const processedChats = Array.from(chatsMap.entries()).map(([conversation_id, messages]) => {
        const lastMessage = messages[0]; // Already sorted by created_at desc
        const otherParticipant = lastMessage.sender_id === user.id ? lastMessage.receiver : lastMessage.sender;
        
        // Safety check for otherParticipant
        if (!otherParticipant) {
          console.warn(`Could not determine other participant for conversation ${conversation_id}`);
          return null;
        }

        return {
          id: conversation_id,
          other_participant: otherParticipant,
          last_message: lastMessage.content,
          last_message_at: lastMessage.created_at,
          // We can add unread count logic here if needed
        };
      }).filter(Boolean); // Filter out nulls from safety check

      // Sort chats by the most recent message
      processedChats.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

      if (mounted.current) {
        setChats(processedChats);
      }

    } catch (error) {
      console.error("Error fetching chats:", error);
      if (mounted.current) {
        setError("Failed to load chats");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const loadConversation = async (conversationId) => {
    if (!user?.id || !conversationId) return;

    try {
      setLoadingMessages(true);
      setError(null);

      // Find the chat to get participant info
      const currentChat = chats.find(c => c.id === conversationId);
      
      // If chat is not in the list, we might need to fetch its details
      if (!currentChat) {
        // This part might need a new function to fetch a single conversation's details
        // For now, we'll rely on the chat being in the list.
        console.warn("Attempted to load a conversation not in the pre-fetched chat list.");
      }

      setActiveConversation({
        id: conversationId,
        other_participant: currentChat?.other_participant
      });

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url, verified),
          reply_to_message:messages!messages_reply_to_id_fkey(id, content, media_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!mounted.current) return;

      setMessages(data || []);
      scrollToBottom();

      await markMessagesAsRead(conversationId);

    } catch (error) {
      console.error("Error loading conversation:", error);
      setError("Failed to load messages");
    } finally {
      if (mounted.current) {
        setLoadingMessages(false);
      }
    }
  };

  const markMessagesAsRead = async (convId) => {
    if (!user?.id || !convId) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      setUnreadCounts(prev => ({
        ...prev,
        [convId]: 0
      }));

    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!messageText.trim() && !uploadingMedia) return;
    if (!activeConversation?.id || !user?.id) {
      console.error("Cannot send message: no active conversation or user.");
      setError("Cannot send message. Please select a conversation.");
      return;
    }

    setSending(true);
    setShowEmojiPicker(false);

    const messagePayload = {
      conversation_id: activeConversation.id,
      sender_id: user.id,
      receiver_id: activeConversation.other_participant.id,
      content: messageText,
      media_url: null,
      reply_to_message_id: replyTo ? replyTo.id : null,
    };

    try {
      const { data, error } = await hookSendMessage(messagePayload);

      if (error) throw error;

      if (mounted.current) {
        setMessageText("");
        setReplyTo(null);
        
        // Optimistically update UI
        setMessages(prev => [...prev, data[0]]);
        
        // Update chat list to bring this chat to top
        setChats(prevChats => {
          const updatedChat = prevChats.find(c => c.id === activeConversation.id);
          if (updatedChat) {
            updatedChat.last_message = messageText;
            updatedChat.last_message_at = new Date().toISOString();
            return [updatedChat, ...prevChats.filter(c => c.id !== activeConversation.id)];
          }
          return prevChats;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (mounted.current) {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      if (mounted.current) {
        setSending(false);
      }
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!user?.id || !activeConversation?.id) return;

    const now = Date.now();
    if (now - lastTypingEmitRef.current < TYPING_THROTTLE) return;

    lastTypingEmitRef.current = now;

    const typingChannel = supabase.channel(`typing:${activeConversation.id}`);
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id }
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation?.id || !user?.id) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    try {
      setUploadingMedia(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-media')
        .getPublicUrl(fileName);

      const receiverId = activeConversation.participant_1_id === user.id
        ? activeConversation.participant_2_id
        : activeConversation.participant_1_id;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          receiver_id: receiverId,
          content: file.type.startsWith('image/') ? '📷 Photo' : '📎 File',
          media_url: publicUrl,
          media_type: file.type,
          read: false
        })
        .select(`*, sender:profiles!messages_sender_id_fkey(*)`)
        .single();

      if (error) throw error;

      if (mounted.current) {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      if (mounted.current) {
        setUploadingMedia(false);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      if (mounted.current) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  // Search functionality
  const performSearch = async (query) => {
    if (!query.trim()) return;

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, verified')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;

      // Map search results to conversation-like objects
      const searchConversations = data.map(profile => ({
        id: `search-${profile.id}`, // Temporary ID
        other_participant: profile,
        last_message: `Search result for "${query}"`,
        last_message_at: new Date().toISOString(),
        isSearchResult: true,
      }));

      setSearchResults(searchConversations);

    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleNewConversation = async (profile) => {
    // Check if a conversation already exists
    const { data: existing, error } = await supabase
      .from('conversations')
      .select('id')
      .or(`(participant_1_id.eq.${user.id},participant_2_id.eq.${profile.id}),(participant_1_id.eq.${profile.id},participant_2_id.eq.${user.id})`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows
      console.error("Error checking for existing conversation:", error);
      return;
    }

    if (existing) {
      navigate(`/messages/${existing.id}`);
    } else {
      // Create a new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user.id,
          participant_2_id: profile.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating new conversation:", createError);
        return;
      }

      if (newConv) {
        await fetchChats(); // Refresh chat list
        navigate(`/messages/${newConv.id}`);
      }
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Start a new conversation with a user
  const startConversation = async (userId) => {
    if (!user?.id || !userId) return;

    try {
      // Check if conversation already exists
      const existingChat = chats.find(chat => 
        chat.other_participant?.id === userId
      );

      if (existingChat) {
        // If conversation exists, load it
        await loadConversation(existingChat.id);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        return;
      }

      // Create a new conversation ID (UUID format)
      const conversationId = `${user.id}_${userId}`.split('').sort().join('');
      
      // Fetch the other user's profile
      const { data: otherUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, verified')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Set up the new conversation
      setActiveConversation({
        id: conversationId,
        other_participant: otherUserProfile
      });
      
      setMessages([]);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Focus the message input
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }

    } catch (error) {
      console.error("Error starting conversation:", error);
      setError("Failed to start conversation");
    }
  };

  const messageList = useMemo(() => {
    return (messages || []).map((message, index) => (
      <motion.div
        key={message.id}
        className={`message ${message.sender_id === user?.id ? 'own' : 'other'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.02 }}
      >
        <div className="message-content">
          <p>{message.content}</p>
          {message.media_url && (
            <img 
              src={message.media_url} 
              alt="Message media" 
              className="message-media"
            />
          )}
        </div>
        <div className="message-time">
          {formatMessageTime(message.created_at)}
        </div>
      </motion.div>
    ));
  }, [messages, user?.id]);

  // Data safety wrapper for chats array
  const safeConversations = useMemo(() => {
    return (chats || []).map(conv => ({
      ...conv,
      chat_id: conv.id, // For compatibility
      last_message: conv.last_message_content ? {
        content: truncateText(conv.last_message_content, 50),
        created_at: conv.last_message_at
      } : null,
      other_participant: conv.other_participant || {}
    }));
  }, [chats]);

  return (
    <components.ErrorBoundary>
      <motion.main
        className="messages-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="messages-container">
          {/* Left Sidebar - Conversations List */}
          <div className={`conversations-sidebar ${activeConversation ? 'hidden-mobile' : ''}`}>
            <div className="sidebar-header">
              <motion.h1
                className="page-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                Messages
              </motion.h1>
              <div className="header-actions">
                <motion.button
                  className={`btn-new-message ${showSearch ? 'active' : ''}`}
                  onClick={() => setShowSearch(!showSearch)}
                  whileTap={{ scale: 0.95 }}
                  aria-label={showSearch ? "Close search" : "New message"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showSearch ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </>
                    )}
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Search Panel */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  className="search-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={performSearch}
                    loading={searching}
                    placeholder="Search users..."
                    user={user}
                    showHistory={false}
                  />

                  {searchResults.length > 0 && (
                    <div className="search-results user-search-for-messaging">
                      <AnimatePresence mode="popLayout">
                        {searchResults.map((result, index) => (
                          <motion.button
                            key={result.id}
                            className="search-result-item user-search-result"
                            onClick={() => startConversation(result.id)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <img
                              src={result.avatar_url || `https://ui-avatars.com/api/?name=${result.username}&background=random&color=fff`}
                              alt={result.username}
                              className="result-avatar"
                            />
                            <div className="result-info">
                              <div className="result-name">
                                {result.full_name || result.username}
                                {result.verified && (
                                  <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                )}
                              </div>
                              <div className="result-username">@{result.username}</div>
                            </div>
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversations List */}
            <div className="conversations-list">
              {loading ? (
                <SkeletonLoader type="list" count={5} />
              ) : safeConversations.length === 0 ? (
                <div className="empty-state">
                  <motion.div
                    className="empty-icon"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💬
                  </motion.div>
                  <h3>No messages yet</h3>
                  <p>Start a conversation with someone</p>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowSearch(true)}
                    whileTap={{ scale: 0.95 }}
                  >
                    New Message
                  </motion.button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {safeConversations.map((conv, index) => {
                    const isOnline = onlineUsers.has(conv.other_participant?.id);
                    const unreadCount = unreadCounts[conv.id] || 0;

                    return (
                      <motion.button
                        key={conv.id}
                        className={`conversation-item conversation-list ${activeConversation?.id === conv.id ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
                        onClick={() => navigate(`/messages/${conv.id}`, { state: { chat: conv } })}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                        whileTap={{ scale: 0.98 }}
                        layout
                      >
                        <div className="conv-avatar-wrapper">
                          <img
                            src={conv.other_participant?.avatar_url || `https://ui-avatars.com/api/?name=${conv.other_participant?.username}&background=random&color=fff`}
                            alt={conv.other_participant?.username}
                            className="conv-avatar"
                          />
                          <OnlineIndicator online={isOnline} />
                        </div>

                        <div className="conv-details">
                          <div className="conv-header">
                            <span className="conv-name">
                              {conv.other_participant?.full_name || conv.other_participant?.username}
                              {conv.other_participant?.verified && (
                                <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                              )}
                            </span>
                            {conv.last_message_at && (
                              <span className="conv-time">
                                {formatMessageTime(conv.last_message_at)}
                              </span>
                            )}
                          </div>
                          <div className="conv-preview">
                            <span className={unreadCount > 0 ? 'unread-text' : ''}>
                              {conv.last_message?.content || 'Start a conversation'}
                            </span>
                            {unreadCount > 0 && (
                              <Badge count={unreadCount} label={`${unreadCount} unread messages`} />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right Panel - Chat View */}
          <div className={`messages-panel ${!activeConversation ? 'hidden-mobile' : ''}`}>
            {!activeConversation ? (
              <div className="no-conversation">
                <motion.div
                  className="empty-icon"
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  💬
                </motion.div>
                <h2>Your Messages</h2>
                <p>Send private messages to your contacts</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="chat-header">
                  <motion.button
                    className="btn-back-mobile"
                    onClick={() => navigate('/messages')}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Back to conversations"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </motion.button>
                  
                  <div className="chat-user-info">
                    <img
                      src={activeConversation.other_participant?.avatar_url || `https://ui-avatars.com/api/?name=${activeConversation.other_participant?.username}&background=random&color=fff`}
                      alt={activeConversation.other_participant?.username}
                      className="chat-avatar"
                    />
                    <div className="chat-details">
                      <h2 className="chat-name">
                        {activeConversation.other_participant?.full_name || activeConversation.other_participant?.username}
                      </h2>
                      <div className="chat-status">
                        <OnlineIndicator online={onlineUsers.has(activeConversation.other_participant?.id)} />
                        <span>
                          {onlineUsers.has(activeConversation.other_participant?.id) ? 'Online' : 'Last seen recently'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="messages-area">
                  {loadingMessages ? (
                    <SkeletonLoader type="list" count={3} />
                  ) : (
                    <div className="messages-list">
                      <AnimatePresence>
                        {(messages || []).map((message, index) => (
                          <motion.div
                            key={message.id}
                            className={`message ${message.sender_id === user?.id ? 'own' : 'other'}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.02 }}
                          >
                            <div className="message-content">
                              <p>{message.content}</p>
                              {message.media_url && (
                                <img 
                                  src={message.media_url} 
                                  alt="Message media" 
                                  className="message-media"
                                />
                              )}
                            </div>
                            <div className="message-time">
                              {formatMessageTime(message.created_at)}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="message-input-area">
                  <form className="message-input-form" onSubmit={sendMessage}>
                    <input
                      ref={messageInputRef}
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={handleTyping}
                      disabled={sending}
                      className="message-input"
                    />
                    <motion.button
                      type="submit"
                      className="btn-send"
                      disabled={!messageText.trim() || sending}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Send message"
                    >
                      {sending ? (
                        <div className="mini-spinner"></div>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      )}
                    </motion.button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.main>
    </components.ErrorBoundary>
  );
}
