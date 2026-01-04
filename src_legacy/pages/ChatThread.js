"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import MessageInput from '../components/MessageInput';
import EmojiPicker from '../components/EmojiPicker';
import VoiceRecorder from '../components/VoiceRecorder';
import TypingIndicator from '../components/TypingIndicator';
import { useMessages } from '../hooks/useMessages';
import useTypingIndicator from '../hooks/useTypingIndicator';
import useReadReceipts from '../hooks/useReadReceipts';
import { formatTime } from '../utils/dateFormatter';
import linkify from '../utils/data/linkify';
import './ChatThread.css';

export default function ChatThread({ conversationId, myUserId, onBack }) {
    const [localMessages, setLocalMessages] = useState([]);
    const [otherUserId, setOtherUserId] = useState(null);
    const [otherUsername, setOtherUsername] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    
    // Use custom hooks
    const isTyping = useTypingIndicator(otherUserId);

    // Fetch conversation participants
    useEffect(() => {
        const fetchConversationDetails = async () => {
            try {
                const { data: conversation } = await supabase
                    .from('conversations')
                    .select('user1_id, user2_id')
                    .eq('id', conversationId)
                    .single();
                
                if (conversation) {
                    const otherId = conversation.user1_id === myUserId ? conversation.user2_id : conversation.user1_id;
                    setOtherUserId(otherId);
                    
                    // Fetch other user's profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', otherId)
                        .single();
                    
                    if (profile) {
                        setOtherUsername(profile.username || 'User');
                    }
                }
            } catch (error) {
                console.error('Error fetching conversation details:', error);
            }
        };
        
        fetchConversationDetails();
    }, [conversationId, myUserId]);

    // Fetch and subscribe to messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });
                
                if (error) throw error;
                setLocalMessages(data || []);
                
                // Mark messages as read
                await supabase
                    .from('chat_messages')
                    .update({ read: true })
                    .eq('conversation_id', conversationId)
                    .neq('sender_id', myUserId);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setLocalMessages([]);
            }
        };
        
        fetchMessages();

        const channel = supabase
            .channel(`chat-${conversationId}`)
            .on(
                'postgres_changes',
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'chat_messages', 
                    filter: `conversation_id=eq.${conversationId}` 
                },
                (payload) => {
                    setLocalMessages(current => [...current, payload.new]);
                    
                    // Mark as read if not my message
                    if (payload.new.sender_id !== myUserId) {
                        supabase
                            .from('chat_messages')
                            .update({ read: true })
                            .eq('id', payload.new.id)
                            .then(() => {});
                    }
                }
            )
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'chat_messages', 
                    filter: `conversation_id=eq.${conversationId}` 
                },
                (payload) => {
                    setLocalMessages(current => 
                        current.map(msg => msg.id === payload.new.id ? payload.new : msg)
                    );
                }
            )
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, myUserId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages]);
    
    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Handle text message sending
    const handleSendMessage = useCallback(async (messageText) => {
        if (!messageText.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = { 
            id: tempId, 
            conversation_id: conversationId, 
            sender_id: myUserId, 
            content: messageText.trim(), 
            created_at: new Date().toISOString(), 
            status: 'sending',
            type: 'text',
            read: false
        };
        
        setLocalMessages(prev => [...prev, optimisticMsg]);

        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert({ 
                    conversation_id: conversationId, 
                    sender_id: myUserId, 
                    content: messageText.trim(),
                    type: 'text'
                })
                .select()
                .single();
                
            if (error) throw error;
            
            setLocalMessages(prev => 
                prev.map(m => m.id === tempId ? { ...data, status: 'sent' } : m)
            );
            
            // Update conversation's last_message_at
            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);
        } catch (error) {
            console.error('Error sending message:', error);
            setLocalMessages(prev => 
                prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)
            );
        }
    }, [conversationId, myUserId]);
    
    // Handle voice message sending
    const handleVoiceSend = useCallback(async (audioBlob, duration) => {
        try {
            setIsUploading(true);
            
            // Upload to Supabase storage
            const fileName = `voice_${Date.now()}.webm`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(`voice/${conversationId}/${fileName}`, audioBlob);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(uploadData.path);
            
            // Insert message
            const { error: insertError } = await supabase
                .from('chat_messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: myUserId,
                    content: publicUrl,
                    type: 'voice',
                    metadata: { duration }
                });
            
            if (insertError) throw insertError;
            
            // Update conversation
            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);
        } catch (error) {
            console.error('Error sending voice message:', error);
            alert('Failed to send voice message');
        } finally {
            setIsUploading(false);
        }
    }, [conversationId, myUserId]);
    
    // Handle file/image/video upload
    const handleFileSend = useCallback(async (files) => {
        try {
            setIsUploading(true);
            
            for (const file of files) {
                const fileType = file.type.startsWith('image/') ? 'image' : 
                               file.type.startsWith('video/') ? 'video' : 'file';
                const fileName = `${fileType}_${Date.now()}_${file.name}`;
                
                // Upload file
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-media')
                    .upload(`${fileType}s/${conversationId}/${fileName}`, file);
                
                if (uploadError) throw uploadError;
                
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(uploadData.path);
                
                // Insert message
                const { error: insertError } = await supabase
                    .from('chat_messages')
                    .insert({
                        conversation_id: conversationId,
                        sender_id: myUserId,
                        content: publicUrl,
                        type: fileType,
                        metadata: { 
                            fileName: file.name,
                            fileSize: file.size,
                            mimeType: file.type
                        }
                    });
                
                if (insertError) throw insertError;
            }
            
            // Update conversation
            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    }, [conversationId, myUserId]);
    
    // Render message content based on type
    const renderMessageContent = (msg) => {
        switch (msg.type) {
            case 'image':
                return (
                    <img 
                        src={msg.content} 
                        alt="Shared image" 
                        className="message-image"
                        loading="lazy"
                    />
                );
            case 'video':
                return (
                    <video 
                        src={msg.content} 
                        controls 
                        className="message-video"
                        preload="metadata"
                    >
                        Your browser doesn't support video playback.
                    </video>
                );
            case 'voice':
                return (
                    <audio 
                        src={msg.content} 
                        controls 
                        className="message-audio"
                        preload="metadata"
                    >
                        Your browser doesn't support audio playback.
                    </audio>
                );
            case 'text':
            default:
                return (
                    <span 
                        className="message-text"
                        dangerouslySetInnerHTML={{ __html: linkify(msg.content || '') }}
                    />
                );
        }
    };

    // Safety: ensure messages is always an array
    const safeMessages = Array.isArray(localMessages) ? localMessages : [];

    return (
        <div className="chat-thread">
            {/* Header */}
            <div className="chat-thread-header">
                <button onClick={onBack} className="back-btn" aria-label="Back to inbox">
                    ← Back to Inbox
                </button>
                {otherUsername && (
                    <h2 className="chat-username">{otherUsername}</h2>
                )}
            </div>

            {/* Messages area - scrollable */}
            <div 
                className="messages-area" 
                ref={messagesContainerRef}
                role="log" 
                aria-live="polite"
                aria-label="Chat messages"
            >
                {safeMessages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    safeMessages.map((msg) => {
                        const isSent = msg.sender_id === myUserId;
                        
                        return (
                            <div 
                                key={msg.id || `temp-${msg.created_at}`} 
                                className={`message-bubble ${isSent ? 'sent' : 'received'}`}
                            >
                                <div className="message-content">
                                    {renderMessageContent(msg)}
                                </div>
                                
                                <div className="message-meta">
                                    <span className="message-time">
                                        {formatTime(new Date(msg.created_at))}
                                    </span>
                                    
                                    {isSent && (
                                        <>
                                            {msg.status && (
                                                <span 
                                                    className={`msg-status ${msg.status}`}
                                                    aria-label={`Message ${msg.status}`}
                                                >
                                                    {msg.status === 'sending' && '⏳'}
                                                    {msg.status === 'sent' && '✓'}
                                                    {msg.status === 'failed' && '❌'}
                                                </span>
                                            )}
                                            {msg.read && (
                                                <span 
                                                    className="msg-status read" 
                                                    aria-label="Message read"
                                                >
                                                    ✓✓
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                
                {/* Typing indicator */}
                {isTyping && otherUsername && (
                    <div className="typing-indicator-wrapper">
                        <TypingIndicator username={otherUsername} />
                    </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {safeMessages.length > 5 && (
                <button 
                    onClick={scrollToBottom}
                    className="scroll-to-bottom-btn"
                    aria-label="Scroll to bottom"
                    title="Scroll to bottom"
                >
                    ↓
                </button>
            )}

            {/* Message input - fixed at bottom */}
            <MessageInput
                onSend={handleSendMessage}
                onVoiceSend={handleVoiceSend}
                onFileSend={handleFileSend}
                disabled={isUploading}
            />
            
            {isUploading && (
                <div className="uploading-indicator" role="status" aria-live="polite">
                    <span>Uploading...</span>
                </div>
            )}
        </div>
    );
}
