import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hook to subscribe to realtime posts updates
 * Listens for INSERT events on the posts table and manages new posts notifications
 */
export const useRealtimePosts = () => {
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState([]);

  useEffect(() => {
    // Subscribe to INSERT events on the posts table
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('New post received:', payload);
          
          // Add the new post to pending posts
          setPendingPosts((prev) => [payload.new, ...prev]);
          
          // Update count and show notification
          setNewPostsCount((prev) => prev + 1);
          setNewPostsAvailable(true);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from posts realtime');
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Reset the notification and return pending posts
   * Call this when user clicks "New posts available" notification
   */
  const consumePendingPosts = useCallback(() => {
    const posts = [...pendingPosts];
    setPendingPosts([]);
    setNewPostsCount(0);
    setNewPostsAvailable(false);
    return posts;
  }, [pendingPosts]);

  /**
   * Dismiss the notification without consuming posts
   */
  const dismissNotification = useCallback(() => {
    setNewPostsAvailable(false);
  }, []);

  return {
    newPostsAvailable,
    newPostsCount,
    pendingPosts,
    consumePendingPosts,
    dismissNotification
  };
};

export default useRealtimePosts;
