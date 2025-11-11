import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useInstagramInteractions(contentId, contentType, user) {
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (!contentId || !contentType || !user) return;

    const fetchData = async () => {
      try {
        // Fetch likes count and user's like status
        const { data: likesData } = await supabase
          .from('likes')
          .select('*')
          .eq(contentType === 'post' ? 'post_id' : 'boltz_id', contentId);

        if (likesData) {
          setLikesCount(likesData.length);
          const userLike = likesData.find(like => like.user_id === user.id);
          setIsLiked(!!userLike);
        }

        // Fetch comments count
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq(contentType === 'post' ? 'post_id' : 'boltz_id', contentId);

        if (commentsData) {
          setCommentsCount(commentsData.length);
        }
      } catch (error) {
        console.error('Error fetching interaction data:', error);
      }
    };

    fetchData();
  }, [contentId, contentType, user]);

  const toggleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    const wasLiked = isLiked;
    const newLiked = !wasLiked;
    
    // Optimistic update
    setIsLiked(newLiked);
    setLikesCount(prev => prev + (newLiked ? 1 : -1));

    try {
      if (wasLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq(contentType === 'post' ? 'post_id' : 'boltz_id', contentId);
      } else {
        // Like
        const likeData = {
          user_id: user.id,
          [contentType === 'post' ? 'post_id' : 'boltz_id']: contentId
        };
        
        await supabase
          .from('likes')
          .insert(likeData);

        // Send notification to content owner
        const { data: contentOwner } = await supabase
          .from(contentType === 'post' ? 'posts' : 'boltz')
          .select('user_id')
          .eq('id', contentId)
          .single();

        if (contentOwner && contentOwner.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: contentOwner.user_id,
            type: 'like',
            from_user_id: user.id,
            content: `liked your ${contentType}`,
            post_id: contentType === 'post' ? contentId : null,
            boltz_id: contentType === 'boltz' ? contentId : null,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setIsLiked(wasLiked);
      setLikesCount(prev => prev + (wasLiked ? 1 : -1));
    } finally {
      setLoading(false);
    }
  };

  const shareContent = async (platform) => {
    // This is handled by the ShareModal component
    // We just log the share event here
    try {
      await supabase.from('shares').insert({
        content_id: contentId,
        content_type: contentType,
        user_id: user.id,
        platform
      });
    } catch (error) {
      console.error('Error logging share:', error);
    }
  };

  return {
    likesCount,
    commentsCount,
    isLiked,
    loading,
    toggleLike,
    shareContent
  };
}