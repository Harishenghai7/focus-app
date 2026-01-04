// ═══════════════════════════════════════════════════════════════════════
// USE MESSAGE QUEUE HOOK - Offline support with retry logic
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { sendTextMessage, sendMediaMessage } from '../../../utils/supabaseRest';

const QUEUE_KEY = 'focus_message_queue';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 30000]; // Exponential backoff

export const useMessageQueue = (conversationId, currentUserId) => {
    const [queue, setQueue] = useState([]);
    const [processing, setProcessing] = useState(false);
    const processingRef = useRef(false);
    const retryTimeoutRef = useRef(null);

    // Load queue from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(QUEUE_KEY);
            if (stored) {
                const allQueues = JSON.parse(stored);
                setQueue(allQueues[conversationId] || []);
            }
        } catch (err) {
            console.error('Error loading message queue:', err);
        }
    }, [conversationId]);

    // Save queue to localStorage
    const saveQueue = useCallback((newQueue) => {
        try {
            const stored = localStorage.getItem(QUEUE_KEY);
            const allQueues = stored ? JSON.parse(stored) : {};
            allQueues[conversationId] = newQueue;
            localStorage.setItem(QUEUE_KEY, JSON.stringify(allQueues));
        } catch (err) {
            console.error('Error saving message queue:', err);
        }
    }, [conversationId]);

    // Add message to queue
    const enqueueMessage = useCallback((message) => {
        const queuedMessage = {
            id: `temp_${Date.now()}_${Math.random()}`,
            ...message,
            status: 'pending',
            retryCount: 0,
            queuedAt: new Date().toISOString()
        };

        setQueue(prev => {
            const newQueue = [...prev, queuedMessage];
            saveQueue(newQueue);
            return newQueue;
        });

        return queuedMessage.id;
    }, [saveQueue]);

    // Process queue
    const processQueue = useCallback(async () => {
        if (processingRef.current || queue.length === 0) return;

        processingRef.current = true;
        setProcessing(true);

        const message = queue[0];

        try {
            console.log('📤 Processing queued message:', message.id);

            let result;
            if (message.type === 'text') {
                result = await sendTextMessage(
                    conversationId,
                    currentUserId,
                    message.content,
                    message.replyToId
                );
            } else if (['image', 'video', 'voice', 'gif', 'sticker'].includes(message.type)) {
                result = await sendMediaMessage(
                    conversationId,
                    currentUserId,
                    message.type,
                    message.attachmentData,
                    message.content
                );
            }

            console.log('✅ Message sent:', result);

            // Remove from queue on success
            setQueue(prev => {
                const newQueue = prev.filter(m => m.id !== message.id);
                saveQueue(newQueue);
                return newQueue;
            });

        } catch (err) {
            console.error('❌ Error sending message:', err);

            // Retry logic
            if (message.retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAYS[message.retryCount];
                console.log(`🔄 Retrying in ${delay}ms (attempt ${message.retryCount + 1}/${MAX_RETRIES})`);

                setQueue(prev => {
                    const newQueue = prev.map(m =>
                        m.id === message.id
                            ? { ...m, retryCount: m.retryCount + 1, status: 'retrying' }
                            : m
                    );
                    saveQueue(newQueue);
                    return newQueue;
                });

                retryTimeoutRef.current = setTimeout(() => {
                    processingRef.current = false;
                    processQueue();
                }, delay);
            } else {
                // Max retries reached, mark as failed
                console.error('💥 Max retries reached, marking as failed');
                setQueue(prev => {
                    const newQueue = prev.map(m =>
                        m.id === message.id
                            ? { ...m, status: 'failed' }
                            : m
                    );
                    saveQueue(newQueue);
                    return newQueue;
                });
            }
        } finally {
            if (!retryTimeoutRef.current) {
                processingRef.current = false;
                setProcessing(false);
            }
        }
    }, [queue, conversationId, currentUserId, saveQueue]);

    // Auto-process queue when online
    useEffect(() => {
        if (queue.length > 0 && !processing && navigator.onLine) {
            processQueue();
        }
    }, [queue, processing, processQueue]);

    // Listen for online event
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Back online, processing queue');
            processQueue();
        };

        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [processQueue]);

    // Retry failed message
    const retryMessage = useCallback((messageId) => {
        setQueue(prev => {
            const newQueue = prev.map(m =>
                m.id === messageId
                    ? { ...m, retryCount: 0, status: 'pending' }
                    : m
            );
            saveQueue(newQueue);
            return newQueue;
        });
    }, [saveQueue]);

    // Remove failed message
    const removeMessage = useCallback((messageId) => {
        setQueue(prev => {
            const newQueue = prev.filter(m => m.id !== messageId);
            saveQueue(newQueue);
            return newQueue;
        });
    }, [saveQueue]);

    return {
        queue,
        processing,
        enqueueMessage,
        retryMessage,
        removeMessage
    };
};
