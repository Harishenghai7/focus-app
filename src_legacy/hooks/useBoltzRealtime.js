import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useBoltzRealtime = ({ boltzList, setBoltzList, currentIndex }) => {
  useEffect(() => {
    if (boltzList.length === 0) return;

    const currentBoltz = boltzList[currentIndex];
    if (!currentBoltz) return;

    // Subscribe to likes
    const likesSubscription = supabase
      .channel(`boltz_likes:${currentBoltz.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boltz_likes',
          filter: `boltz_id=eq.${currentBoltz.id}`
        },
        async (payload) => {
          // Refetch like count
          const { count } = await supabase
            .from('boltz_likes')
            .select('*', { count: 'exact', head: true })
            .eq('boltz_id', currentBoltz.id);

          setBoltzList(prev => prev.map(boltz =>
            boltz.id === currentBoltz.id
              ? { ...boltz, likes: count || 0 }
              : boltz
          ));
        }
      )
      .subscribe();

    // Subscribe to comments
    const commentsSubscription = supabase
      .channel(`boltz_comments:${currentBoltz.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boltz_comments',
          filter: `boltz_id=eq.${currentBoltz.id}`
        },
        async (payload) => {
          // Refetch comment count
          const { count } = await supabase
            .from('boltz_comments')
            .select('*', { count: 'exact', head: true })
            .eq('boltz_id', currentBoltz.id);

          setBoltzList(prev => prev.map(boltz =>
            boltz.id === currentBoltz.id
              ? { ...boltz, comments: count || 0 }
              : boltz
          ));
        }
      )
      .subscribe();

    // Subscribe to views
    const viewsSubscription = supabase
      .channel(`boltz_views:${currentBoltz.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boltz',
          filter: `id=eq.${currentBoltz.id}`
        },
        (payload) => {
          if (payload.new.views !== undefined) {
            setBoltzList(prev => prev.map(boltz =>
              boltz.id === currentBoltz.id
                ? { ...boltz, views: payload.new.views }
                : boltz
            ));
          }
        }
      )
      .subscribe();

    return () => {
      likesSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
      viewsSubscription.unsubscribe();
    };
  }, [boltzList, currentIndex, setBoltzList]);
};
