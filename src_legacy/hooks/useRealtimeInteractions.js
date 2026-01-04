/**
 * useRealtimeInteractions Hook
 * 
 * Handles real-time like/comment/share updates via Supabase realtime channels.
 * Provides optimistic updates and conflict resolution.
 * 
 * @returns {Object} Interaction methods and state
 * @example
 * const { likePost, unlikePost, isLiked, getLikeCount } = useRealtimeInteractions();
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useRealtimeInteractions = () => {
  const [interactions, setInteractions] = useState({
    likes: new Map(), // postId -> { count, isLiked, likeId }
    comments: new Map(), // postId -> { count }
    shares: new Map(), // postId -> { count }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const channelRef = useRef(null);
  const pendingOperations = useRef(new Set()); // Track optimistic updates
  const currentUserId = useRef(null);

  // Initialize current user
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId.current = user?.id;
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    initUser();
  }, []);

  /**
   * Fetch initial interaction counts for a post
   */
  const fetchPostInteractions = useCallback(async (postId) => {
    try {
      if (!currentUserId.current) return;

      // Fetch like count and user's like status
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('id, userid')
        .eq('postid', postId);

      if (likesError) throw likesError;

      const likeCount = likes?.length || 0;
      const userLike = likes?.find(like => like.userid === currentUserId.current);

      // Fetch comment count
      const { count: commentCount, error: commentsError } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('postid', postId);

      if (commentsError) throw commentsError;

      // Fetch share count
      const { count: shareCount, error: sharesError } = await supabase
        .from('shares')
        .select('id', { count: 'exact', head: true })
        .eq('postid', postId);

      if (sharesError) throw sharesError;

      setInteractions(prev => ({
        likes: new Map(prev.likes).set(postId, {
          count: likeCount,
          isLiked: !!userLike,
          likeId: userLike?.id || null,
        }),
        comments: new Map(prev.comments).set(postId, {
          count: commentCount || 0,
        }),
        shares: new Map(prev.shares).set(postId, {
          count: shareCount || 0,
        }),
      }));
    } catch (err) {
      console.error('Error fetching post interactions:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Like a post (optimistic update)
   */
  const likePost = useCallback(async (postId) => {
    if (!currentUserId.current) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    const operationId = `like-${postId}-${Date.now()}`;
    pendingOperations.current.add(operationId);

    // Optimistic update
    setInteractions(prev => {
      const currentLike = prev.likes.get(postId) || { count: 0, isLiked: false, likeId: null };
      if (currentLike.isLiked) {
        // Already liked, don't duplicate
        pendingOperations.current.delete(operationId);
        return prev;
      }

      return {
        ...prev,
        likes: new Map(prev.likes).set(postId, {
          count: currentLike.count + 1,
          isLiked: true,
          likeId: 'pending',
        }),
      };
    });

    try {
      const { data, error: likeError } = await supabase
        .from('likes')
        .insert({
          postid: postId,
          userid: currentUserId.current,
          createdat: new Date().toISOString(),
        })
        .select()
        .single();

      if (likeError) throw likeError;

      // Update with actual like ID
      setInteractions(prev => ({
        ...prev,
        likes: new Map(prev.likes).set(postId, {
          ...prev.likes.get(postId),
          likeId: data.id,
        }),
      }));

      pendingOperations.current.delete(operationId);
      return { success: true, data };
    } catch (err) {
      console.error('Error liking post:', err);
      
      // Rollback optimistic update
      setInteractions(prev => {
        const currentLike = prev.likes.get(postId);
        return {
          ...prev,
          likes: new Map(prev.likes).set(postId, {
            count: Math.max(0, (currentLike?.count || 1) - 1),
            isLiked: false,
            likeId: null,
          }),
        };
      });

      pendingOperations.current.delete(operationId);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Unlike a post (optimistic update)
   */
  const unlikePost = useCallback(async (postId) => {
    if (!currentUserId.current) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    const operationId = `unlike-${postId}-${Date.now()}`;
    pendingOperations.current.add(operationId);

    // Store previous state for rollback
    const currentLike = interactions.likes.get(postId);
    if (!currentLike?.isLiked) {
      // Not liked, nothing to unlike
      pendingOperations.current.delete(operationId);
      return { success: false, error: 'Post not liked' };
    }

    const previousLikeId = currentLike.likeId;

    // Optimistic update
    setInteractions(prev => ({
      ...prev,
      likes: new Map(prev.likes).set(postId, {
        count: Math.max(0, currentLike.count - 1),
        isLiked: false,
        likeId: null,
      }),
    }));

    try {
      const { error: unlikeError } = await supabase
        .from('likes')
        .delete()
        .eq('postid', postId)
        .eq('userid', currentUserId.current);

      if (unlikeError) throw unlikeError;

      pendingOperations.current.delete(operationId);
      return { success: true };
    } catch (err) {
      console.error('Error unliking post:', err);
      
      // Rollback optimistic update
      setInteractions(prev => ({
        ...prev,
        likes: new Map(prev.likes).set(postId, {
          count: currentLike.count,
          isLiked: true,
          likeId: previousLikeId,
        }),
      }));

      pendingOperations.current.delete(operationId);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [interactions.likes]);

  /**
   * Comment on a post (optimistic update)
   */
  const commentPost = useCallback(async (postId, text) => {
    if (!currentUserId.current) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    if (!text || text.trim().length === 0) {
      setError('Comment text is required');
      return { success: false, error: 'Comment text is required' };
    }

    const operationId = `comment-${postId}-${Date.now()}`;
    pendingOperations.current.add(operationId);

    // Optimistic update
    setInteractions(prev => {
      const currentComments = prev.comments.get(postId) || { count: 0 };
      return {
        ...prev,
        comments: new Map(prev.comments).set(postId, {
          count: currentComments.count + 1,
        }),
      };
    });

    try {
      const { data, error: commentError } = await supabase
        .from('comments')
        .insert({
          postid: postId,
          userid: currentUserId.current,
          text: text.trim(),
          createdat: new Date().toISOString(),
        })
        .select()
        .single();

      if (commentError) throw commentError;

      pendingOperations.current.delete(operationId);
      return { success: true, data };
    } catch (err) {
      console.error('Error commenting on post:', err);
      
      // Rollback optimistic update
      setInteractions(prev => {
        const currentComments = prev.comments.get(postId);
        return {
          ...prev,
          comments: new Map(prev.comments).set(postId, {
            count: Math.max(0, (currentComments?.count || 1) - 1),
          }),
        };
      });

      pendingOperations.current.delete(operationId);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Share a post (optimistic update)
   */
  const sharePost = useCallback(async (postId) => {
    if (!currentUserId.current) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    const operationId = `share-${postId}-${Date.now()}`;
    pendingOperations.current.add(operationId);

    // Optimistic update
    setInteractions(prev => {
      const currentShares = prev.shares.get(postId) || { count: 0 };
      return {
        ...prev,
        shares: new Map(prev.shares).set(postId, {
          count: currentShares.count + 1,
        }),
      };
    });

    try {
      const { data, error: shareError } = await supabase
        .from('shares')
        .insert({
          postid: postId,
          userid: currentUserId.current,
          createdat: new Date().toISOString(),
        })
        .select()
        .single();

      if (shareError) throw shareError;

      pendingOperations.current.delete(operationId);
      return { success: true, data };
    } catch (err) {
      console.error('Error sharing post:', err);
      
      // Rollback optimistic update
      setInteractions(prev => {
        const currentShares = prev.shares.get(postId);
        return {
          ...prev,
          shares: new Map(prev.shares).set(postId, {
            count: Math.max(0, (currentShares?.count || 1) - 1),
          }),
        };
      });

      pendingOperations.current.delete(operationId);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Check if user has liked a post
   */
  const isLiked = useCallback((postId) => {
    return interactions.likes.get(postId)?.isLiked || false;
  }, [interactions.likes]);

  /**
   * Get like count for a post
   */
  const getLikeCount = useCallback((postId) => {
    return interactions.likes.get(postId)?.count || 0;
  }, [interactions.likes]);

  /**
   * Get comment count for a post
   */
  const getCommentCount = useCallback((postId) => {
    return interactions.comments.get(postId)?.count || 0;
  }, [interactions.comments]);

  /**
   * Get share count for a post
   */
  const getShareCount = useCallback((postId) => {
    return interactions.shares.get(postId)?.count || 0;
  }, [interactions.shares]);

  /**
   * Set up realtime subscriptions
   */
  useEffect(() => {
    if (!currentUserId.current) return;

    // Create a channel for realtime updates
    const channel = supabase.channel('interactions-realtime');

    // Subscribe to likes table
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
        },
        (payload) => {
          const { postid, userid, id } = payload.new;
          
          // Skip if this is from a pending operation
          if (pendingOperations.current.size > 0) {
            const isPending = Array.from(pendingOperations.current).some(
              op => op.startsWith(`like-${postid}`)
            );
            if (isPending) return;
          }

          setInteractions(prev => {
            const currentLike = prev.likes.get(postid) || { count: 0, isLiked: false, likeId: null };
            return {
              ...prev,
              likes: new Map(prev.likes).set(postid, {
                count: currentLike.count + 1,
                isLiked: userid === currentUserId.current ? true : currentLike.isLiked,
                likeId: userid === currentUserId.current ? id : currentLike.likeId,
              }),
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'likes',
        },
        (payload) => {
          const { postid, userid } = payload.old;
          
          // Skip if this is from a pending operation
          if (pendingOperations.current.size > 0) {
            const isPending = Array.from(pendingOperations.current).some(
              op => op.startsWith(`unlike-${postid}`)
            );
            if (isPending) return;
          }

          setInteractions(prev => {
            const currentLike = prev.likes.get(postid);
            if (!currentLike) return prev;

            return {
              ...prev,
              likes: new Map(prev.likes).set(postid, {
                count: Math.max(0, currentLike.count - 1),
                isLiked: userid === currentUserId.current ? false : currentLike.isLiked,
                likeId: userid === currentUserId.current ? null : currentLike.likeId,
              }),
            };
          });
        }
      );

    // Subscribe to comments table
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const { postid } = payload.new;
          
          // Skip if this is from a pending operation
          if (pendingOperations.current.size > 0) {
            const isPending = Array.from(pendingOperations.current).some(
              op => op.startsWith(`comment-${postid}`)
            );
            if (isPending) return;
          }

          setInteractions(prev => {
            const currentComments = prev.comments.get(postid) || { count: 0 };
            return {
              ...prev,
              comments: new Map(prev.comments).set(postid, {
                count: currentComments.count + 1,
              }),
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const { postid } = payload.old;

          setInteractions(prev => {
            const currentComments = prev.comments.get(postid);
            if (!currentComments) return prev;

            return {
              ...prev,
              comments: new Map(prev.comments).set(postid, {
                count: Math.max(0, currentComments.count - 1),
              }),
            };
          });
        }
      );

    // Subscribe to shares table
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shares',
        },
        (payload) => {
          const { postid } = payload.new;
          
          // Skip if this is from a pending operation
          if (pendingOperations.current.size > 0) {
            const isPending = Array.from(pendingOperations.current).some(
              op => op.startsWith(`share-${postid}`)
            );
            if (isPending) return;
          }

          setInteractions(prev => {
            const currentShares = prev.shares.get(postid) || { count: 0 };
            return {
              ...prev,
              shares: new Map(prev.shares).set(postid, {
                count: currentShares.count + 1,
              }),
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'shares',
        },
        (payload) => {
          const { postid } = payload.old;

          setInteractions(prev => {
            const currentShares = prev.shares.get(postid);
            if (!currentShares) return prev;

            return {
              ...prev,
              shares: new Map(prev.shares).set(postid, {
                count: Math.max(0, currentShares.count - 1),
              }),
            };
          });
        }
      );

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to interactions realtime channel');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to interactions channel');
        setError('Failed to subscribe to realtime updates');
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Subscription timed out');
        setError('Realtime subscription timed out');
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log('🧹 Unsubscribing from interactions realtime channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    interactions,
    loading,
    error,
    
    // Methods
    likePost,
    unlikePost,
    commentPost,
    sharePost,
    
    // Getters
    isLiked,
    getLikeCount,
    getCommentCount,
    getShareCount,
    
    // Utilities
    fetchPostInteractions,
    clearError,
  };
};

export default useRealtimeInteractions;