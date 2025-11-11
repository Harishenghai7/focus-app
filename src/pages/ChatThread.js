import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './ChatThread.css';

export default function ChatThread({ conversationId, myUserId, onBack }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', conversationId).order('created_at');
            setMessages(data || []);
        };
        fetchMessages();

        const channel = supabase.channel(`chat-${conversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
                payload => setMessages(current => [...current, payload.new])
            ).subscribe();
        
        return () => supabase.removeChannel(channel);
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        await supabase.from('chat_messages').insert({ conversation_id: conversationId, sender_id: myUserId, content: newMessage });
        setNewMessage('');
    };

    return (
        <div className="chat-thread">
            <button onClick={onBack} className="back-btn">Back to Inbox</button>
            <div className="messages-area">
                {messages.map(msg => (
                    <div key={msg.id} className={`message-bubble ${msg.sender_id === myUserId ? 'sent' : 'received'}`}>
                        {msg.content}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}
