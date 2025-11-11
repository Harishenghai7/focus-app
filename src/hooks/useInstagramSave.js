import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useInstagramSave(contentId, contentType, user) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if content is saved
  useEffect(() => {
    if (!contentId || !contentType || !user) return;

    const checkSaved = async () => {
      try {
        const { data: saveData } = await supabase
          .from('saves')
          .select('*')
          .eq('user_id', user.id)
          .eq(contentType === 'post' ? 'post_id' : 'boltz_id', contentId);

        setIsSaved(!!saveData && saveData.length > 0);
      } catch (error) {
        console.error('Error checking save status:', error);
      }
    };

    checkSaved();
  }, [contentId, contentType, user]);

  const toggleSave = async () => {
    if (!user || loading) return;

    setLoading(true);
    const wasSaved = isSaved;
    const newSaved = !wasSaved;
    
    // Optimistic update
    setIsSaved(newSaved);

    try {
      if (wasSaved) {
        // Unsave
        await supabase
          .from('saves')
          .delete()
          .eq('user_id', user.id)
          .eq(contentType === 'post' ? 'post_id' : 'boltz_id', contentId);
      } else {
        // Save
        const saveData = {
          user_id: user.id,
          [contentType === 'post' ? 'post_id' : 'boltz_id']: contentId
        };
        
        await supabase
          .from('saves')
          .insert(saveData);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      // Revert optimistic update
      setIsSaved(wasSaved);
    } finally {
      setLoading(false);
    }
  };

  return {
    isSaved,
    loading,
    toggleSave
  };
}