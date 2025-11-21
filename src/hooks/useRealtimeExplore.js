import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useRealtimeExplore Hook
 * 
 * Purpose: Subscribe to real-time updates for explore page content
 * 
 * Features:
 * - Listens for new posts, boltz, and user profile updates
 * - Provides callback for handling real-time changes
 * - Auto-cleanup on unmount
 * 
 * @param {Function} onUpdate - Callback function when updates occur
 * @returns {void}
 * 
 * @example
 * useRealtimeExplore((update) => {
 *   if (update.type === 'new_post') {
 *     // Refresh content or show banner
 *     fetchExploreContent(true);
 *   }
 * });
 */
export const useRealtimeExplore = (onUpdate) => {
  const channelsRef = useRef([]);

  useEffect(() => {
    if (!onUpdate || typeof onUpdate !== 'function') {
      return;
    }

    // Subscribe to posts table changes
    const postsChannel = supabase
      .channel('explore_posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          onUpdate({
            type: 'new_post',
            data: payload.new
          });
        }
      )
      .subscribe();

    // Subscribe to profiles table changes
    const profilesChannel = supabase
      .channel('explore_profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          onUpdate({
            type: 'profile_update',
            data: payload.new
          });
        }
      )
      .subscribe();

    // Subscribe to boltz table changes (if applicable)
    const boltzChannel = supabase
      .channel('explore_boltz')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'boltz'
        },
        (payload) => {
          onUpdate({
            type: 'new_boltz',
            data: payload.new
          });
        }
      )
      .subscribe();

    channelsRef.current = [postsChannel, profilesChannel, boltzChannel];

    // Cleanup function
    return () => {
      channelsRef.current.forEach((channel) => {
        if (channel && channel.unsubscribe) {
          channel.unsubscribe();
        }
      });
      channelsRef.current = [];
    };
  }, [onUpdate]);
};

export default useRealtimeExplore;
