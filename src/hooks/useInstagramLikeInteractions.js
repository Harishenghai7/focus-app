import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useInstagramLikeInteractions = (contentId, contentType, user) => {
  const [likes, setLikes] = useState(new Set());
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef(null);
  const optimisticRef = useRef(false);

  const getColumnName = useCallback(() => {
    return contentType === 'post' ? 'post_id' : 
           contentType === 'boltz' ? 'boltz_id' : 'flash_id';
  }, [contentType]);

  const fetchCounts = useCallback(async () => {
    if (!contentId || !user) return;

    try {
      const columnName = getColumnName();
      const tableName = contentType === 'post' ? 'posts' : contentType === 'boltz' ? 'boltz' : 'flash';
      
      // Get content with counts and user's like status
      const { data: contentData } = await supabase
        .from(tableName)
        .select('likes_count, comments_count, shares_count')
        .eq('id', contentId)
        .single();

      // Check if user has liked this content
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq(columnName, contentId)
        .eq('user_id', user.id)
        .single();

      setLikesCount(contentData?.likes_count || 0);
      setCommentsCount(contentData?.comments_count || 0);
      setIsLiked(!!userLike);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, [contentId, user, getColumnName, contentType]);

  useEffect(() => {
    fetchCounts();
    
    if (!contentId) return;

    const columnName = getColumnName();
    
    const tableName = contentType === 'post' ? 'posts' : contentType === 'boltz' ? 'boltz' : 'flash';

    // Real-time content updates (for count changes)
    const contentChannel = supabase
      .channel(`${contentType}_${contentId}_counts`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: tableName,
        filter: `id=eq.${contentId}`
      }, (payload) => {
        if (!optimisticRef.current) {
          setLikesCount(payload.new.likes_count || 0);
          setCommentsCount(payload.new.comments_count || 0);
        }
      })
      .subscribe();

    // Real-time likes subscription (for user's like status)
    const likesChannel = supabase
      .channel(`likes_${contentType}_${contentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
        filter: `${columnName}=eq.${contentId}`
      }, (payload) => {
        if (payload.new.user_id === user?.id) {
          setIsLiked(true);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'likes',
        filter: `${columnName}=eq.${contentId}`
      }, (payload) => {
        if (payload.old.user_id === user?.id) {
          setIsLiked(false);
        }
      })
      .subscribe();

    subscriptionRef.current = [contentChannel, likesChannel];

    return () => {
      subscriptionRef.current?.forEach(channel => channel.unsubscribe());
    };
  }, [contentId, contentType, user, getColumnName, fetchCounts]);

  const toggleLike = useCallback(async () => {
    if (!user || loading) return;

    const wasLiked = isLiked;
    const newLiked = !wasLiked;
    
    // Optimistic update
    optimisticRef.current = true;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    setLikes(prev => {
      const newSet = new Set(prev);
      if (newLiked) {
        newSet.add(user.id);
      } else {
        newSet.delete(user.id);
      }
      return newSet;
    });

    setLoading(true);

    try {
      const columnName = getColumnName();
      
      if (wasLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq(columnName, contentId)
          .eq('user_id', user.id);
      } else {
        const insertData = { user_id: user.id };
        insertData[columnName] = contentId;
        
        await supabase
          .from('likes')
          .insert(insertData);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
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
      setTimeout(() => {
        optimisticRef.current = false;
      }, 500);
    }
  }, [user, loading, isLiked, contentId, getColumnName]);

  const addComment = useCallback(async (content) => {
    if (!user || !content.trim()) return null;

    try {
      const columnName = getColumnName();
      const insertData = {
        user_id: user.id,
        content: content.trim()
      };
      insertData[columnName] = contentId;

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
  }, [user, contentId, getColumnName]);

  return {
    likes,
    likesCount,
    commentsCount,
    isLiked,
    loading,
    toggleLike,
    addComment,
    refreshCounts: fetchCounts
  };
};