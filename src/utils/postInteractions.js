import { supabase } from '../lib/supabase';

export async function fetchUserPostLikeIds(userId, postIds) {
  if (!userId || !postIds?.length) return [];
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (error) {
    console.warn('[likes] post_likes:', error.message);
    return [];
  }
  return (data || []).map((r) => r.post_id).filter(Boolean);
}

export async function fetchUserSavedPostIds(userId, postIds) {
  if (!userId || !postIds?.length) return [];
  const { data, error } = await supabase
    .from('post_saves')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (!error && data) return data.map((r) => r.post_id).filter(Boolean);
  if (error) console.warn('[saves] post_saves:', error.message);
  return [];
}

export async function setPostLikeDb(userId, postId, shouldLike) {
  const { data, error } = await supabase.rpc('toggle_post_like_rpc', {
    p_post_id: postId,
    p_user_id: userId,
    p_should_like: shouldLike,
  });
  if (error) throw error;
  return data;
}

export async function setPostSaveDb(userId, postId, shouldSave) {
  const { data, error } = await supabase.rpc('toggle_post_save_rpc', {
    p_post_id: postId,
    p_user_id: userId,
    p_should_save: shouldSave,
  });
  if (error) throw error;
  return data;
}
