// src/services/postService.js
import { supabase } from '../lib/supabase';

export const fetchHomePosts = async (userId, limit = 20) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      likes_count,
      comments_count,
      profiles (
        id,
        username,
        full_name,
        avatar_url,
        trust_score
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};
