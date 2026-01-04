import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for Focusly AI-powered messaging features
 * Smart replies, message suggestions, translation, and moderation
 */
export const useFocuslyAI = () => {
    const [processing, setProcessing] = useState(false);

    // Generate smart reply suggestions
    const generateSmartReplies = useCallback(async (messageContent) => {
        setProcessing(true);
        try {
            // Call Focusly AI API for smart replies
            const { data, error } = await supabase.functions.invoke('focusly-ai', {
                body: {
                    action: 'smart_replies',
                    message: messageContent
                }
            });

            if (error) throw error;

            return data.replies || [
                'Thanks!',
                'Sounds good',
                'Got it',
                'Will do'
            ];
        } catch (error) {
            console.error('Error generating smart replies:', error);
            // Fallback suggestions
            return ['👍', '😊', 'Thanks!', 'Okay'];
        } finally {
            setProcessing(false);
        }
    }, []);

    // Translate message
    const translateMessage = useCallback(async (text, targetLanguage = 'en') => {
        setProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('focusly-ai', {
                body: {
                    action: 'translate',
                    text,
                    target_language: targetLanguage
                }
            });

            if (error) throw error;

            return data.translated_text || text;
        } catch (error) {
            console.error('Error translating message:', error);
            return text;
        } finally {
            setProcessing(false);
        }
    }, []);

    // Analyze sentiment
    const analyzeSentiment = useCallback(async (text) => {
        setProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('focusly-ai', {
                body: {
                    action: 'sentiment',
                    text
                }
            });

            if (error) throw error;

            return data.sentiment || 'neutral';
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            return 'neutral';
        } finally {
            setProcessing(false);
        }
    }, []);

    // Moderate content
    const moderateContent = useCallback(async (text) => {
        setProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('focusly-ai', {
                body: {
                    action: 'moderate',
                    text
                }
            });

            if (error) throw error;

            return {
                is_safe: data.is_safe !== false,
                flags: data.flags || [],
                confidence: data.confidence || 0
            };
        } catch (error) {
            console.error('Error moderating content:', error);
            return { is_safe: true, flags: [], confidence: 0 };
        } finally {
            setProcessing(false);
        }
    }, []);

    // Generate message suggestions based on context
    const generateSuggestions = useCallback(async (conversationHistory) => {
        setProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('focusly-ai', {
                body: {
                    action: 'suggestions',
                    history: conversationHistory.slice(-5) // Last 5 messages
                }
            });

            if (error) throw error;

            return data.suggestions || [];
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return [];
        } finally {
            setProcessing(false);
        }
    }, []);

    // Auto-complete message
    const autoComplete = useCallback(async (partialText) => {
        if (!partialText || partialText.length < 3) return [];

        setProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('focusly-ai', {
                body: {
                    action: 'autocomplete',
                    text: partialText
                }
            });

            if (error) throw error;

            return data.completions || [];
        } catch (error) {
            console.error('Error auto-completing:', error);
            return [];
        } finally {
            setProcessing(false);
        }
    }, []);

    // Summarize conversation
    const summarizeConversation = useCallback(async (messages) => {
        setProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('focusly-ai', {
                body: {
                    action: 'summarize',
                    messages: messages.map(m => m.content)
                }
            });

            if (error) throw error;

            return data.summary || 'No summary available';
        } catch (error) {
            console.error('Error summarizing conversation:', error);
            return 'Unable to generate summary';
        } finally {
            setProcessing(false);
        }
    }, []);

    return {
        processing,
        generateSmartReplies,
        translateMessage,
        analyzeSentiment,
        moderateContent,
        generateSuggestions,
        autoComplete,
        summarizeConversation
    };
};
