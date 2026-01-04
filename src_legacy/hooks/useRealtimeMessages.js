import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hook for real-time message updates
 * Subscribes to new messages and provides callbacks for updates
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.userId - Current user's ID
 * @param {Function} options.onNewMessage - Callback when new message arrives
 * @param {Function} options.onMessageUpdate - Callback when message is updated
 * @param {Function} options.onMessageDelete - Callback when message is deleted
 * @param {boolean} options.playSound - Whether to play notification sound
 * @param {string} options.threadId - Optional: Listen to specific thread only
 * @returns {Object} - Subscription status and controls
 */
export const useRealtimeMessages = ({
  userId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  playSound = false,
  threadId = null
}) => {
  const subscriptionRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize notification sound
  useEffect(() => {
    if (playSound) {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [playSound]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (playSound && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    }
  }, [playSound]);

  // Handle new message insert
  const handleInsert = useCallback(async (payload) => {
    console.log('New message received:', payload.new);
    
    const newMessage = payload.new;
    
    // Skip if filtering by thread and message is for different thread
    if (threadId && newMessage.thread_id !== threadId) {
      return;
    }

    // Skip if message is from current user (no need for notification)
    if (newMessage.sender_id === userId) {
      return;
    }

    // Fetch additional message data (sender info, etc.)
    try {
      const { data: enrichedMessage, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          thread:chatthreads!messages_thread_id_fkey(
            id,
            subject,
            is_group
          )
        `)
        .eq('id', newMessage.id)
        .single();

      if (error) throw error;

      // Play notification sound for new message
      playNotificationSound();

      // Call the callback with enriched message data
      if (onNewMessage) {
        onNewMessage(enrichedMessage);
      }

      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        const senderName = enrichedMessage.sender?.full_name || 
                          enrichedMessage.sender?.username || 
                          'Someone';
        const notificationBody = enrichedMessage.content?.substring(0, 100) || 'New message';
        
        new Notification(`${senderName} sent a message`, {
          body: notificationBody,
          icon: enrichedMessage.sender?.avatar_url || '/default-avatar.png',
          tag: `message-${enrichedMessage.id}`,
          requireInteraction: false
        });
      }
    } catch (error) {
      console.error('Error fetching enriched message:', error);
      // Still call callback with basic message data
      if (onNewMessage) {
        onNewMessage(newMessage);
      }
    }
  }, [userId, threadId, onNewMessage, playNotificationSound]);

  // Handle message update
  const handleUpdate = useCallback((payload) => {
    console.log('Message updated:', payload.new);
    
    const updatedMessage = payload.new;
    
    // Skip if filtering by thread and message is for different thread
    if (threadId && updatedMessage.thread_id !== threadId) {
      return;
    }

    if (onMessageUpdate) {
      onMessageUpdate(updatedMessage);
    }
  }, [threadId, onMessageUpdate]);

  // Handle message delete
  const handleDelete = useCallback((payload) => {
    console.log('Message deleted:', payload.old);
    
    const deletedMessage = payload.old;
    
    // Skip if filtering by thread and message is for different thread
    if (threadId && deletedMessage.thread_id !== threadId) {
      return;
    }

    if (onMessageDelete) {
      onMessageDelete(deletedMessage);
    }
  }, [threadId, onMessageDelete]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) {
      console.log('No userId provided, skipping message subscription');
      return;
    }

    console.log('Setting up real-time message subscription', { userId, threadId });

    // Create subscription to messages table
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Filter by thread if specified
          ...(threadId && { filter: `thread_id=eq.${threadId}` })
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          ...(threadId && { filter: `thread_id=eq.${threadId}` })
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          ...(threadId && { filter: `thread_id=eq.${threadId}` })
        },
        handleDelete
      )
      .subscribe((status) => {
        console.log('Message subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to message updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to message updates');
        }
      });

    subscriptionRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up message subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, threadId, handleInsert, handleUpdate, handleDelete]);

  return {
    isSubscribed: !!subscriptionRef.current,
    requestNotificationPermission,
    playNotificationSound
  };
};

export default useRealtimeMessages;
