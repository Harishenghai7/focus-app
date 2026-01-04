import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useTypingIndicator Hook
 * 
 * Purpose: Show "User is typing..." indicator in real-time chats
 * 
 * Features:
 * - Emit typing event to channel
 * - Listen for others typing
 * - Auto-clear after 3 seconds
 * - Debounce rapid typing events
 * 
 * @param {string} currentUserId - The ID of the current user
 * @param {string} currentUsername - The username to display
 * @returns {Object} Typing indicator methods and state
 */
const useTypingIndicator = (currentUserId, currentUsername) => {
  const [typingUsers, setTypingUsers] = useState({}); // { chatId: [{ userId, username, timestamp }] }
  const channelsRef = useRef(new Map()); // Map of chatId -> channel
  const typingTimersRef = useRef(new Map()); // Map of chatId+userId -> timeout
  const lastTypingEmitRef = useRef(new Map()); // Map of chatId -> timestamp
  const clearTimersRef = useRef(new Map()); // Map of chatId -> timeout for auto-stop

  // Debounce delay for emitting typing events (milliseconds)
  const DEBOUNCE_DELAY = 500;
  // Auto-clear typing indicator after this time (milliseconds)
  const AUTO_CLEAR_DELAY = 3000;

  /**
   * Subscribe to typing indicators for a specific chat
   * @param {string} chatId - The chat ID to subscribe to
   */
  const subscribeToChat = useCallback((chatId) => {
    if (!chatId || !currentUserId) return;

    // Check if already subscribed
    if (channelsRef.current.has(chatId)) {
      return;
    }

    const channelName = `typing:${chatId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // Don't receive own typing events
      },
    });

    // Listen for typing events
    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, username, isTyping } = payload.payload;

        if (userId === currentUserId) return; // Ignore own events

        if (isTyping) {
          // Add user to typing list
          setTypingUsers((prev) => {
            const chatTyping = prev[chatId] || [];
            const filtered = chatTyping.filter((u) => u.userId !== userId);
            return {
              ...prev,
              [chatId]: [
                ...filtered,
                { userId, username, timestamp: Date.now() },
              ],
            };
          });

          // Clear any existing timer for this user
          const timerKey = `${chatId}:${userId}`;
          if (typingTimersRef.current.has(timerKey)) {
            clearTimeout(typingTimersRef.current.get(timerKey));
          }

          // Set auto-clear timer
          const timer = setTimeout(() => {
            setTypingUsers((prev) => {
              const chatTyping = prev[chatId] || [];
              const filtered = chatTyping.filter((u) => u.userId !== userId);
              return {
                ...prev,
                [chatId]: filtered,
              };
            });
            typingTimersRef.current.delete(timerKey);
          }, AUTO_CLEAR_DELAY);

          typingTimersRef.current.set(timerKey, timer);
        } else {
          // Remove user from typing list
          setTypingUsers((prev) => {
            const chatTyping = prev[chatId] || [];
            const filtered = chatTyping.filter((u) => u.userId !== userId);
            return {
              ...prev,
              [chatId]: filtered,
            };
          });

          // Clear timer
          const timerKey = `${chatId}:${userId}`;
          if (typingTimersRef.current.has(timerKey)) {
            clearTimeout(typingTimersRef.current.get(timerKey));
            typingTimersRef.current.delete(timerKey);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to typing indicators for chat: ${chatId}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Failed to subscribe to typing indicators for chat: ${chatId}`);
        }
      });

    channelsRef.current.set(chatId, channel);
  }, [currentUserId]);

  /**
   * Unsubscribe from typing indicators for a specific chat
   * @param {string} chatId - The chat ID to unsubscribe from
   */
  const unsubscribeFromChat = useCallback((chatId) => {
    if (!chatId) return;

    const channel = channelsRef.current.get(chatId);
    if (channel) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(chatId);
    }

    // Clear all timers for this chat
    typingTimersRef.current.forEach((timer, key) => {
      if (key.startsWith(`${chatId}:`)) {
        clearTimeout(timer);
        typingTimersRef.current.delete(key);
      }
    });

    // Clear auto-stop timer
    if (clearTimersRef.current.has(chatId)) {
      clearTimeout(clearTimersRef.current.get(chatId));
      clearTimersRef.current.delete(chatId);
    }

    // Remove typing users for this chat
    setTypingUsers((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
  }, []);

  /**
   * Emit typing indicator (with debouncing)
   * @param {string} chatId - The chat ID
   * @param {boolean} isTyping - Whether user is typing
   */
  const setTyping = useCallback(
    async (chatId, isTyping) => {
      if (!chatId || !currentUserId || !currentUsername) return;

      // Ensure we're subscribed to this chat
      if (!channelsRef.current.has(chatId)) {
        subscribeToChat(chatId);
      }

      const channel = channelsRef.current.get(chatId);
      if (!channel) return;

      // Debounce typing events
      const now = Date.now();
      const lastEmit = lastTypingEmitRef.current.get(chatId) || 0;

      if (isTyping) {
        // Only emit if enough time has passed since last emit
        if (now - lastEmit < DEBOUNCE_DELAY) {
          // Reset auto-stop timer
          if (clearTimersRef.current.has(chatId)) {
            clearTimeout(clearTimersRef.current.get(chatId));
          }

          const clearTimer = setTimeout(() => {
            setTyping(chatId, false);
          }, AUTO_CLEAR_DELAY);

          clearTimersRef.current.set(chatId, clearTimer);
          return;
        }

        // Emit typing event
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: currentUserId,
            username: currentUsername,
            isTyping: true,
          },
        });

        lastTypingEmitRef.current.set(chatId, now);

        // Clear any existing auto-stop timer
        if (clearTimersRef.current.has(chatId)) {
          clearTimeout(clearTimersRef.current.get(chatId));
        }

        // Set auto-stop timer
        const clearTimer = setTimeout(() => {
          setTyping(chatId, false);
        }, AUTO_CLEAR_DELAY);

        clearTimersRef.current.set(chatId, clearTimer);
      } else {
        // Emit stop typing event
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: currentUserId,
            username: currentUsername,
            isTyping: false,
          },
        });

        lastTypingEmitRef.current.delete(chatId);

        // Clear auto-stop timer
        if (clearTimersRef.current.has(chatId)) {
          clearTimeout(clearTimersRef.current.get(chatId));
          clearTimersRef.current.delete(chatId);
        }
      }
    },
    [currentUserId, currentUsername, subscribeToChat]
  );

  /**
   * Get list of users currently typing in a chat
   * @param {string} chatId - The chat ID
   * @returns {Array<string>} Array of usernames currently typing
   */
  const whoIsTyping = useCallback(
    (chatId) => {
      if (!chatId) return [];

      const chatTyping = typingUsers[chatId] || [];
      
      // Filter out stale typing indicators (older than AUTO_CLEAR_DELAY)
      const now = Date.now();
      const activeTyping = chatTyping.filter(
        (user) => now - user.timestamp < AUTO_CLEAR_DELAY
      );

      return activeTyping.map((user) => user.username);
    },
    [typingUsers]
  );

  /**
   * Get formatted typing indicator text
   * @param {string} chatId - The chat ID
   * @returns {string} Formatted typing text (e.g., "John is typing..." or "John and 2 others are typing...")
   */
  const getTypingText = useCallback(
    (chatId) => {
      const typing = whoIsTyping(chatId);
      
      if (typing.length === 0) return '';
      if (typing.length === 1) return `${typing[0]} is typing...`;
      if (typing.length === 2) return `${typing[0]} and ${typing[1]} are typing...`;
      return `${typing[0]} and ${typing.length - 1} others are typing...`;
    },
    [whoIsTyping]
  );

  /**
   * Check if anyone is typing in a chat
   * @param {string} chatId - The chat ID
   * @returns {boolean} True if anyone is typing
   */
  const isAnyoneTyping = useCallback(
    (chatId) => {
      return whoIsTyping(chatId).length > 0;
    },
    [whoIsTyping]
  );

  /**
   * Stop typing indicator for current user in a chat
   * @param {string} chatId - The chat ID
   */
  const stopTyping = useCallback(
    (chatId) => {
      setTyping(chatId, false);
    },
    [setTyping]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all channels
      channelsRef.current.forEach((channel, chatId) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();

      // Clear all timers
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();

      clearTimersRef.current.forEach((timer) => clearTimeout(timer));
      clearTimersRef.current.clear();
    };
  }, []);

  return {
    // Core methods
    setTyping,
    stopTyping,
    whoIsTyping,
    
    // Helper methods
    getTypingText,
    isAnyoneTyping,
    
    // Channel management
    subscribeToChat,
    unsubscribeFromChat,
    
    // State
    typingUsers, // Raw typing state for advanced use
  };
};

export default useTypingIndicator;
