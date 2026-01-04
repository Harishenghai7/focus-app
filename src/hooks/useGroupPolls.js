import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for creating and managing polls in group chats
 * WhatsApp-style polls with multiple options
 */
export const useGroupPolls = (groupId) => {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create a poll
    const createPoll = useCallback(async (question, options, senderId) => {
        if (!question || !options || options.length < 2) {
            focusToast.error('Poll must have a question and at least 2 options');
            return null;
        }

        setLoading(true);
        try {
            // Create poll message
            const pollData = {
                group_id: groupId,
                sender_id: senderId,
                message_type: 'poll',
                content: question,
                poll_data: {
                    question,
                    options: options.map((opt, index) => ({
                        id: index,
                        text: opt,
                        votes: []
                    })),
                    created_at: new Date().toISOString(),
                    multiple_answers: false
                }
            };

            const { data, error } = await supabase
                .from('group_messages')
                .insert(pollData)
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Poll created');
            return data;
        } catch (error) {
            console.error('Error creating poll:', error);
            focusToast.error('Failed to create poll');
            return null;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    // Vote on a poll
    const votePoll = useCallback(async (messageId, optionId, userId) => {
        setLoading(true);
        try {
            // Get current poll data
            const { data: message, error: fetchError } = await supabase
                .from('group_messages')
                .select('poll_data')
                .eq('id', messageId)
                .single();

            if (fetchError) throw fetchError;

            const pollData = message.poll_data;

            // Remove user's previous votes if not multiple choice
            if (!pollData.multiple_answers) {
                pollData.options.forEach(option => {
                    option.votes = option.votes.filter(v => v !== userId);
                });
            }

            // Add new vote
            const option = pollData.options.find(opt => opt.id === optionId);
            if (option && !option.votes.includes(userId)) {
                option.votes.push(userId);
            }

            // Update poll
            const { error: updateError } = await supabase
                .from('group_messages')
                .update({ poll_data: pollData })
                .eq('id', messageId);

            if (updateError) throw updateError;

            focusToast.success('Vote recorded');
            return true;
        } catch (error) {
            console.error('Error voting on poll:', error);
            focusToast.error('Failed to vote');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get poll results
    const getPollResults = useCallback((pollData) => {
        const totalVotes = pollData.options.reduce((sum, opt) => sum + opt.votes.length, 0);

        return pollData.options.map(option => ({
            ...option,
            voteCount: option.votes.length,
            percentage: totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0
        }));
    }, []);

    // Check if user has voted
    const hasUserVoted = useCallback((pollData, userId) => {
        return pollData.options.some(option => option.votes.includes(userId));
    }, []);

    return {
        polls,
        loading,
        createPoll,
        votePoll,
        getPollResults,
        hasUserVoted
    };
};
