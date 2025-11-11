import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useRealtimeInteractions = (contentId, contentType, user) => {
  const [likes, setLikes] = useState(new Set());
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef(null);

  // Fetch initial interaction data
  const fetchInteractions = useCallback(async () => {
    if (!contentId || !user) return;

    try {
      // Build filter conditions
      const likeFilter = contentType === 'post' ? 'post_id' : contentType === 'boltz' ? 'boltz_id' : 'flash_id';
      const commentFilter = contentType === 'post' ? 'post_id' : contentType === 'boltz' ? 'boltz_id' : 'flash_id';
      const shareFilter = contentType === 'post' ? 'post_id' : contentType === 'boltz' ? 'boltz_id' : 'flash_id';

      // Get likes count and user's like status
      const { data: likesData, count: totalLikes } = await supabase
        .from('likes')
        .select('user_id', { count: 'exact' })
        .eq(likeFilter, contentId);

      // Get comments count
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq(commentFilter, contentId);

      // Get shares count
      const { count: totalShares } = await supabase
        .from('shares')
        .select('*', { count: 'exact' })
        .eq(shareFilter, contentId);

      const userLiked = likesData?.some(like => like.user_id === user.id) || false;
      const likeUsers = new Set(likesData?.map(like => like.user_id) || []);

      setLikes(likeUsers);
      setLikesCount(totalLikes || 0);
      setCommentsCount(totalComments || 0);
      setSharesCount(totalShares || 0);
      setIsLiked(userLiked);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  }, [contentId, contentType, user]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!contentId) return;

    fetchInteractions();

    // Subscribe to likes changes
    const likeFilter = contentType === 'post' ? 'post_id' : contentType === 'boltz' ? 'boltz_id' : 'flash_id';
    const likesChannel = supabase
      .channel(`${contentType}_${contentId}_likes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `${likeFilter}=eq.${contentId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLikes(prev => new Set([...prev, payload.new.user_id]));
          setLikesCount(prev => prev + 1);
          if (payload.new.user_id === user?.id) {
            setIsLiked(true);
          }
        } else if (payload.eventType === 'DELETE') {
          setLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(payload.old.user_id);
            return newSet;
          });
          setLikesCount(prev => Math.max(0, prev - 1));
          if (payload.old.user_id === user?.id) {
            setIsLiked(false);
          }
        }
      })
      .subscribe();

    // Subscribe to comments changes
    const commentFilter = contentType === 'post' ? 'post_id' : contentType === 'boltz' ? 'boltz_id' : 'flash_id';
    const commentsChannel = supabase
      .channel(`${contentType}_${contentId}_comments`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `${commentFilter}=eq.${contentId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCommentsCount(prev => prev + 1);
        } else if (payload.eventType === 'DELETE') {
          setCommentsCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    // Subscribe to shares changes
    const sharesChannel = supabase
      .channel(`${contentType}_${contentId}_shares`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shares',
        filter: `${contentType}_id=eq.${contentId}`
      }, () => {
        setSharesCount(prev => prev + 1);
      })
      .subscribe();

    subscriptionRef.current = [likesChannel, commentsChannel, sharesChannel];

    return () => {
      subscriptionRef.current?.forEach(channel => channel.unsubscribe());
    };
  }, [contentId, contentType, user, fetchInteractions]);

  // Optimistic like toggle
  const toggleLike = useCallback(async () => {
    if (!user || loading) return;

    const wasLiked = isLiked;
    const optimisticLiked = !wasLiked;
    const optimisticCount = wasLiked ? likesCount - 1 : likesCount + 1;

    // Optimistic update
    setIsLiked(optimisticLiked);
    setLikesCount(optimisticCount);
    setLikes(prev => {
      const newSet = new Set(prev);
      if (optimisticLiked) {
        newSet.add(user.id);
      } else {
        newSet.delete(user.id);
      }
      return newSet;
    });

    setLoading(true);

    try {
      const likeFilter = contentType === 'post' ? 'post_id' : contentType === 'boltz' ? 'boltz_id' : 'flash_id';
      
      if (wasLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq(likeFilter, contentId)
          .eq('user_id', user.id);
      } else {
        const insertData = { user_id: user.id };
        if (contentType === 'post') insertData.post_id = contentId;
        else if (contentType === 'boltz') insertData.boltz_id = contentId;
        else if (contentType === 'flash') insertData.flash_id = contentId;
        
        await supabase
          .from('likes')
          .insert(insertData);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikesCount(wasLiked ? likesCount + 1 : likesCount - 1);
      setLikes(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.add(user.id);
        } else {
          newSet.delete(user.id);
        }
        return newSet;
      });
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loading, isLiked, likesCount, contentId, contentType]);

  // Add comment
  const addComment = useCallback(async (content, parentId = null) => {
    if (!user || !content.trim()) return null;

    try {
      const insertData = {
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parentId
      };
      
      if (contentType === 'post') insertData.post_id = contentId;
      else if (contentType === 'boltz') insertData.boltz_id = contentId;
      else if (contentType === 'flash') insertData.flash_id = contentId;

      const { data, error } = await supabase
        .from('comments')
        .insert(insertData)
        .select(`
          *,
          profiles!comments_user_id_fkey(username, avatar_url, verified)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }, [user, contentId, contentType]);

  // Share content
  const shareContent = useCallback(async (platform = 'copy') => {
    if (!user) return false;

    try {
      await supabase
        .from('shares')
        .insert({
          [`${contentType}_id`]: contentId,
          user_id: user.id,
          platform
        });

      return true;
    } catch (error) {
      console.error('Error sharing content:', error);
      return false;
    }
  }, [user, contentId, contentType]);

  return {
    likes,
    likesCount,
    commentsCount,
    sharesCount,
    isLiked,
    loading,
    toggleLike,
    addComment,
    shareContent,
    refreshInteractions: fetchInteractions
  };
};