// src/services/flashService.js
import { supabase } from '../lib/supabase';

export const fetchFlashStories = async () => {
  const { data, error } = await supabase
    .from('flash')
    .select(`
      id,
      media_url,
      created_at,
      user_id,
      profiles (
        username,
        avatar_url
      )
    `)
    .gt(
      'created_at',
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
