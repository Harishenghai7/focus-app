// src/hooks/useMessages.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for managing chat messages with real-time updates
 * 
 * @param {string} chatThreadId - The ID of the chat thread
 * @param {string} chatType - Type of chat ('direct' or 'group')
 * @returns {Object} Messages state and control functions
 */
export const useMessages = (chatThreadId, chatType = 'direct') => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesPerPage = 50;

  // Determine table and field names based on chat type
  const table = chatType === 'group' ? 'group_messages' : 'messages';
  const idField = chatType === 'group' ? 'group_id' : 'chat_thread_id';

  /**
   * Fetch messages for the chat thread
   */
  const fetchMessages = useCallback(async (offset = 0) => {
    if (!chatThreadId || !user) return;

    try {
      setLoading(offset === 0);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from(table)
        .select(`
          *,
          sender:profiles!${table}_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .eq(idField, chatThreadId)
        .order('created_at', { ascending: false })
        .range(offset, offset + messagesPerPage - 1);

      if (fetchError) throw fetchError;

      const formattedMessages = (data || []).map(msg => ({
        ...msg,
        sender: msg.sender || {},
        isOwn: msg.sender_id === user.id
      }));

      if (offset === 0) {
        setMessages(formattedMessages);
      } else {
        setMessages(prev => [...prev, ...formattedMessages]);
      }

      setHasMore(data?.length === messagesPerPage);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chatThreadId, user, table, idField]);

  /**
   * Load more messages (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMessages(messages.length);
    }
  }, [loading, hasMore, messages.length, fetchMessages]);

  /**
   * Send a new message with text and optional attachments
   */
  const sendMessage = useCallback(async (text, attachments = []) => {
    if (!chatThreadId || !user || (!text?.trim() && attachments.length === 0)) {
      return null;
    }

    try {
      setSending(true);
      setError(null);

      // Prepare message data
      const messageData = {
        [idField]: chatThreadId,
        sender_id: user.id,
        content: text?.trim() || null,
        message_type: attachments.length > 0 ? 'media' : 'text',
        attachments: attachments.length > 0 ? attachments : null,
        is_read: false,
        created_at: new Date().toISOString()
      };

      // Insert message
      const { data, error: insertError } = await supabase
        .from(table)
        .insert([messageData])
        .select(`
          *,
          sender:profiles!${table}_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (insertError) throw insertError;

      // Update chat thread's last message and updated_at (only for direct messages)
      if (chatType === 'direct') {
        await supabase
          .from('chat_threads')
          .update({
            last_message_id: data.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', chatThreadId);
      }

      // Create notifications for other participants
      const participantsTable = chatType === 'group' ? 'group_members' : 'chat_participants';
      const participantField = chatType === 'group' ? 'group_id' : 'chat_thread_id';

      const { data: participants } = await supabase
        .from(participantsTable)
        .select('user_id')
        .eq(participantField, chatThreadId)
        .neq('user_id', user.id);

      if (participants && participants.length > 0) {
        const notifications = participants.map(p => ({
          user_id: p.user_id,
          type: 'message',
          content: `New message from ${user.username || user.full_name}`,
          related_id: data.id,
          related_type: 'message'
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      return null;
    } finally {
      setSending(false);
    }
  }, [chatThreadId, user, chatType, table, idField]);

  /**
   * Send a media message (image, video, audio, file)
   */
  const sendMediaMessage = useCallback(async (file, mediaType, caption = '') => {
    if (!chatThreadId || !user || !file) return null;

    try {
      setSending(true);
      setError(null);

      // Upload file to storage
      const fileExt = file.name?.split('.').pop() || 'jpg';
      const fileName = `${chatType}-${chatThreadId}/${Date.now()}.${fileExt}`;
      const bucketName = mediaType === 'voice' ? 'voice-messages' : 'chat-media';

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Create attachment object
      const attachment = {
        type: mediaType,
        url: publicUrl,
        name: file.name,
        size: file.size
      };

      // Send message with attachment
      return await sendMessage(caption, [attachment]);
    } catch (err) {
      console.error('Error sending media message:', err);
      setError(err.message);
      return null;
    } finally {
      setSending(false);
    }
  }, [chatThreadId, user, chatType, sendMessage]);

  /**
   * Mark a specific message as read
   */
  const markAsRead = useCallback(async (messageId) => {
    if (!messageId || !user) return;

    try {
      const { error: updateError } = await supabase
        .from(table)
        .update({ is_read: true })
        .eq('id', messageId)
        .neq('sender_id', user.id); // Don't mark own messages as read

      if (updateError) throw updateError;

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [user, table]);

  /**
   * Mark all messages in thread as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!chatThreadId || !user) return;

    try {
      // Use RPC function if available
      if (chatType === 'group') {
        await supabase.rpc('reset_group_unread_count', {
          p_group_id: chatThreadId,
          p_user_id: user.id
        });
      } else {
        await supabase.rpc('mark_messages_read', {
          chat_uuid: chatThreadId,
          user_uuid: user.id
        });
      }

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.sender_id !== user.id ? { ...msg, is_read: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking all messages as read:', err);
      
      // Fallback to direct update
      try {
        await supabase
          .from(table)
          .update({ is_read: true })
          .eq(idField, chatThreadId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
      } catch (fallbackErr) {
        console.error('Fallback mark as read failed:', fallbackErr);
      }
    }
  }, [chatThreadId, user, chatType, table, idField]);

  /**
   * Set typing indicator
   */
  const setTyping = useCallback((isTyping) => {
    if (!chatThreadId || !user || !channelRef.current) return;

    try {
      if (isTyping) {
        // Send typing indicator
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            username: user.username || user.full_name,
            is_typing: true
          }
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      } else {
        // Stop typing indicator
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            username: user.username || user.full_name,
            is_typing: false
          }
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  }, [chatThreadId, user]);

  /**
   * Delete a message (own messages only)
   */
  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId || !user) return false;

    try {
      // Verify ownership
      const { data: message } = await supabase
        .from(table)
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (!message || message.sender_id !== user.id) {
        throw new Error('You can only delete your own messages');
      }

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', messageId);

      if (deleteError) throw deleteError;

      // Update local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err.message);
      return false;
    }
  }, [user, table]);

  /**
   * Edit a message (own messages only)
   */
  const editMessage = useCallback(async (messageId, newContent) => {
    if (!messageId || !user || !newContent?.trim()) return false;

    try {
      // Verify ownership
      const { data: message } = await supabase
        .from(table)
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (!message || message.sender_id !== user.id) {
        throw new Error('You can only edit your own messages');
      }

      const { data, error: updateError } = await supabase
        .from(table)
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: data.content, edited_at: data.edited_at }
            : msg
        )
      );

      return true;
    } catch (err) {
      console.error('Error editing message:', err);
      setError(err.message);
      return false;
    }
  }, [user, table]);

  /**
   * React to a message with an emoji
   */
  const reactToMessage = useCallback(async (messageId, emoji) => {
    if (!messageId || !user || !emoji) return false;

    try {
      const { error: reactError } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        });

      if (reactError) {
        // If reaction already exists, remove it (toggle)
        if (reactError.code === '23505') { // Unique constraint violation
          await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', user.id)
            .eq('emoji', emoji);
        } else {
          throw reactError;
        }
      }

      return true;
    } catch (err) {
      console.error('Error reacting to message:', err);
      return false;
    }
  }, [user]);

  /**
   * Setup real-time subscriptions
   */
  useEffect(() => {
    if (!chatThreadId || !user) return;

    // Create channel for real-time updates
    const channel = supabase.channel(`chat:${chatThreadId}`, {
      config: {
        broadcast: { self: false }
      }
    });

    channelRef.current = channel;

    // Subscribe to new messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          filter: `${idField}=eq.${chatThreadId}`
        },
        async (payload) => {
          // Fetch full message with sender details
          const { data } = await supabase
            .from(table)
            .select(`
              *,
              sender:profiles!${table}_sender_id_fkey(
                id,
                username,
                full_name,
                avatar_url,
                is_verified
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const formattedMessage = {
              ...data,
              sender: data.sender || {},
              isOwn: data.sender_id === user.id
            };

            setMessages(prev => [formattedMessage, ...prev]);

            // Auto-mark as read if it's not our message
            if (data.sender_id !== user.id) {
              setTimeout(() => markAsRead(data.id), 1000);
            }
          }
        }
      )
      // Subscribe to message updates (edits, read status)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: `${idField}=eq.${chatThreadId}`
        },
        (payload) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      )
      // Subscribe to message deletions
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table,
          filter: `${idField}=eq.${chatThreadId}`
        },
        (payload) => {
          setMessages(prev =>
            prev.filter(msg => msg.id !== payload.old.id)
          );
        }
      )
      // Subscribe to typing indicators
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, username, is_typing } = payload.payload;
        
        // Ignore own typing indicators
        if (user_id === user.id) return;

        setTypingUsers(prev => {
          const updated = new Set(prev);
          if (is_typing) {
            updated.add(username);
          } else {
            updated.delete(username);
          }
          return updated;
        });

        // Auto-remove typing indicator after 5 seconds
        if (is_typing) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const updated = new Set(prev);
              updated.delete(username);
              return updated;
            });
          }, 5000);
        }
      })
      .subscribe();

    // Initial fetch
    fetchMessages();

    // Mark all as read when opening chat
    markAllAsRead();

    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatThreadId, user, table, idField, fetchMessages, markAsRead, markAllAsRead]);

  return {
    // State
    messages,
    loading,
    error,
    sending,
    hasMore,
    typingUsers: Array.from(typingUsers),
    
    // Actions
    sendMessage,
    sendMediaMessage,
    markAsRead,
    markAllAsRead,
    setTyping,
    deleteMessage,
    editMessage,
    reactToMessage,
    loadMore,
    refresh: () => fetchMessages(0)
  };
};

export default useMessages;
