/**
 * useInstagramInteractions Hook
 * @hook
 * @param {string} postId - Instagram post ID
 * @returns {Object} { likes, comments, error }
 * @example
 * const { likes, comments } = useInstagramInteractions(postId);
 */
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useInstagramInteractions(postId) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        // Fetch likes count and user's like status
        const { data: likesData } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId);

        if (likesData) {
          setLikes(likesData.length);
          const userLike = likesData.find(like => like.user_id === user.id);
          setIsLiked(!!userLike);
        }

        // Fetch comments
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId);

        if (commentsData) {
          setComments(commentsData);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      }
    };

    if (postId) fetchData();
    return () => { cancelled = true; };
  }, [postId]);

  const toggleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    const wasLiked = isLiked;
    const newLiked = !wasLiked;
    
    // Optimistic update
    setIsLiked(newLiked);
    setLikes(prev => prev + (newLiked ? 1 : -1));

    try {
      if (wasLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
      } else {
        // Like
        const likeData = {
          user_id: user.id,
          post_id: postId
        };
        
        await supabase
          .from('likes')
          .insert(likeData);

        // Send notification to content owner
        const { data: contentOwner } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single();

        if (contentOwner && contentOwner.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: contentOwner.user_id,
            type: 'like',
            from_user_id: user.id,
            content: `liked your post`,
            post_id: postId,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setIsLiked(wasLiked);
      setLikes(prev => prev + (wasLiked ? 1 : -1));
    } finally {
      setLoading(false);
    }
  };

  return {
    likes,
    comments,
    error,
    isLiked,
    loading,
    toggleLike,
  };
}