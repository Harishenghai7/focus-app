/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * useBoltzReactions — Reaction Management for Boltz Videos
 * Optimistic UI, Supabase integration, realtime subscriptions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useFocusUser } from '../context/FocusUserContext';

export const REACTION_TYPES = [
  { emoji: '🔥', label: 'Fire', key: 'fire' },
  { emoji: '💯', label: 'Hundred', key: 'hundred' },
  { emoji: '😍', label: 'Love', key: 'love_eyes' },
  { emoji: '😂', label: 'Laugh', key: 'laugh' },
  { emoji: '💀', label: 'Dead', key: 'dead' },
  { emoji: '🤯', label: 'Mind Blown', key: 'mind_blown' },
];

export const useBoltzReactions = (boltzId) => {
  const { user } = useFocusUser();
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const floatingIdCounter = useRef(0);

  // Fetch existing reactions
  useEffect(() => {
    if (!boltzId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('boltz_reactions')
          .select('reaction_type, user_id')
          .eq('boltz_id', boltzId);

        if (data) {
          const grouped = {};
          data.forEach(r => {
            grouped[r.reaction_type] = (grouped[r.reaction_type] || 0) + 1;
            if (r.user_id === user?.id) setUserReaction(r.reaction_type);
          });
          setReactions(grouped);
        }
      } catch (_) {
        // Silent fail — reactions table may not exist yet
      }
    })();
  }, [boltzId, user?.id]);

  // Add floating reaction animation
  const addFloatingReaction = useCallback((emoji) => {
    const id = ++floatingIdCounter.current;
    const reaction = {
      id,
      emoji,
      x: 30 + Math.random() * 40,
      delay: Math.random() * 0.3,
    };
    setFloatingReactions(prev => [...prev, reaction]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  }, []);

  // Send reaction (optimistic)
  const sendReaction = useCallback(async (reactionKey) => {
    if (!user?.id || !boltzId) return;

    const emoji = REACTION_TYPES.find(r => r.key === reactionKey)?.emoji || '🔥';

    // Optimistic update
    setReactions(prev => ({
      ...prev,
      [reactionKey]: (prev[reactionKey] || 0) + 1,
      ...(userReaction ? { [userReaction]: Math.max(0, (prev[userReaction] || 1) - 1) } : {}),
    }));
    setUserReaction(reactionKey);
    addFloatingReaction(emoji);
    setShowPicker(false);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(40);

    // Persist to database
    try {
      await supabase.from('boltz_reactions').upsert({
        boltz_id: boltzId,
        user_id: user.id,
        reaction_type: reactionKey,
        created_at: new Date().toISOString(),
      }, { onConflict: 'boltz_id,user_id' });
    } catch (_) {
      // Silent fail
    }
  }, [user?.id, boltzId, userReaction, addFloatingReaction]);

  // Remove reaction
  const removeReaction = useCallback(async () => {
    if (!user?.id || !boltzId || !userReaction) return;

    setReactions(prev => ({
      ...prev,
      [userReaction]: Math.max(0, (prev[userReaction] || 1) - 1),
    }));
    setUserReaction(null);

    try {
      await supabase.from('boltz_reactions')
        .delete()
        .eq('boltz_id', boltzId)
        .eq('user_id', user.id);
    } catch (_) {}
  }, [user?.id, boltzId, userReaction]);

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return {
    reactions,
    userReaction,
    totalReactions,
    showPicker,
    setShowPicker,
    sendReaction,
    removeReaction,
    floatingReactions,
    addFloatingReaction,
  };
};

export default useBoltzReactions;
