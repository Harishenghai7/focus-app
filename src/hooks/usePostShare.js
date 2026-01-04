/**
 * usePostShare Hook
 * Handles post sharing with multiple share types
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const usePostShare = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const sharePost = useMutation({
        mutationFn: async ({ postId, shareType, recipientId = null, postData }) => {
            if (!user) throw new Error('Must be logged in to share posts');

            // Log share action
            const { error: shareError } = await supabase
                .from('post_shares')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    share_type: shareType,
                    recipient_id: recipientId,
                });

            if (shareError) throw shareError;

            // Increment analytics
            await supabase.rpc('increment_post_shares', { post_uuid: postId });

            // Handle different share types
            switch (shareType) {
                case 'story':
                    // Add to user's stories
                    const { error: storyError } = await supabase
                        .from('stories')
                        .insert({
                            user_id: user.id,
                            shared_post_id: postId,
                            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        });
                    if (storyError) throw storyError;
                    break;

                case 'dm':
                    // Send as message
                    if (!recipientId) throw new Error('Recipient required for DM');
                    const { error: dmError } = await supabase
                        .from('messages')
                        .insert({
                            sender_id: user.id,
                            recipient_id: recipientId,
                            type: 'post_share',
                            content: postId,
                        });
                    if (dmError) throw dmError;
                    break;

                case 'copy_link':
                    // Copy link to clipboard
                    const url = `${window.location.origin}/p/${postId}`;
                    await navigator.clipboard.writeText(url);
                    break;

                case 'external':
                    // External sharing handled by caller
                    break;

                default:
                    break;
            }

            return { shareType };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });

            const messages = {
                story: 'Shared to your story!',
                dm: 'Sent via message!',
                copy_link: 'Link copied to clipboard!',
                external: 'Shared successfully!',
            };

            toast.success(messages[data.shareType] || 'Shared!');
        },
        onError: (error) => {
            toast.error('Failed to share post');
            console.error('Share error:', error);
        },
    });

    return {
        sharePost: sharePost.mutate,
        isSharing: sharePost.isLoading,
    };
};
