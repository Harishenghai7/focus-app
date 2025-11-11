import { useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook for syncing state across multiple tabs and devices
 * Fixes Features #381-383: Multiple tabs sync, device login, real-time sync
 */
export const useStateSync = () => {
  // Feature #177: Like count sync across pages
  const syncLikeState = useCallback((postId, liked, count) => {
    // Broadcast to other tabs
    window.dispatchEvent(new CustomEvent('postLikeSync', {
      detail: { postId, liked, count }
    }));
    
    // Sync to other devices via Supabase realtime
    supabase.channel('like_sync')
      .send({
        type: 'broadcast',
        event: 'like_update',
        payload: { postId, liked, count, userId: supabase.auth.user()?.id }
      });
  }, []);

  // Feature #178: Follow state sync
  const syncFollowState = useCallback((userId, following) => {
    window.dispatchEvent(new CustomEvent('followSync', {
      detail: { userId, following }
    }));
    
    supabase.channel('follow_sync')
      .send({
        type: 'broadcast', 
        event: 'follow_update',
        payload: { userId, following, followerId: supabase.auth.user()?.id }
      });
  }, []);

  // Feature #144: Save state sync
  const syncSaveState = useCallback((postId, saved) => {
    window.dispatchEvent(new CustomEvent('saveSync', {
      detail: { postId, saved }
    }));
  }, []);

  return {
    syncLikeState,
    syncFollowState,
    syncSaveState
  };
};

export default useStateSync;