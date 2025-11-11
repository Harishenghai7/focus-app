// src/hooks/useMessages.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useMessages = (chatId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!chatId || !userId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(username, avatar_url)
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        setMessages(data || []);
        
        // Mark as read
        await supabase.rpc('mark_messages_read', {
          chat_uuid: chatId,
          user_uuid: userId
        }).catch(err => console.warn('Mark as read failed:', err));
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          setMessages(prev => [...prev, { ...payload.new, sender }]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          );
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
          ));
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, userId]);

  return { messages, loading };
};
