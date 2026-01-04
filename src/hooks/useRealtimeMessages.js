import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeMessages = (currentUserId, otherUserId) => {
    const [realtimeMessages, setRealtimeMessages] = useState([]);

    useEffect(() => {
        if (!currentUserId || !otherUserId) return;

        // Subscribe to new messages
        const messagesChannel = supabase
            .channel(`messages:${currentUserId}:${otherUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${otherUserId},receiver_id=eq.${currentUserId}`
                },
                (payload) => {
                    setRealtimeMessages(prev => [...prev, payload.new]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=in.(${currentUserId},${otherUserId}),receiver_id=in.(${currentUserId},${otherUserId})`
                },
                (payload) => {
                    setRealtimeMessages(prev =>
                        prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    setRealtimeMessages(prev =>
                        prev.filter(msg => msg.id !== payload.old.id)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
        };
    }, [currentUserId, otherUserId]);

    const clearRealtimeMessages = () => {
        setRealtimeMessages([]);
    };

    return {
        realtimeMessages,
        clearRealtimeMessages
    };
};
