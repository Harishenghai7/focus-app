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

            const { data: shareRpcData, error: shareError } = await supabase.rpc('register_post_share_rpc', {
                p_post_id: postId,
                p_user_id: user.id,
                p_share_type: shareType,
                p_recipient_id: recipientId,
            });
            if (shareError) throw shareError;

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

            return { shareType, postId, shareRpcData };
        },
        onMutate: async ({ postId }) => {
            await queryClient.cancelQueries({ queryKey: ['posts'] });
            const previousEntries = queryClient.getQueriesData({ queryKey: ['posts'] });
            queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        posts: (page.posts || []).map((post) =>
                            post.id === postId
                                ? { ...post, shares_count: (post.shares_count || 0) + 1 }
                                : post
                        ),
                    })),
                };
            });
            return { previousEntries };
        },
        onSuccess: (data) => {
            const serverCount = data?.shareRpcData?.shares_count ?? data?.shareRpcData?.count;
            if (typeof serverCount === 'number') {
                queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            posts: (page.posts || []).map((post) =>
                                post.id === data.postId
                                    ? { ...post, shares_count: serverCount }
                                    : post
                            ),
                        })),
                    };
                });
            }

            const messages = {
                story: 'Shared to your story!',
                dm: 'Sent via message!',
                copy_link: 'Link copied to clipboard!',
                external: 'Shared successfully!',
            };

            toast.success(messages[data.shareType] || 'Shared!');
        },
        onError: (error, _variables, context) => {
            if (context?.previousEntries?.length) {
                context.previousEntries.forEach(([key, value]) => {
                    queryClient.setQueryData(key, value);
                });
            }
            toast.error('Failed to share post');
            console.error('Share error:', error);
        },
    });

    return {
        sharePost: sharePost.mutate,
        isSharing: sharePost.isLoading,
    };
};
