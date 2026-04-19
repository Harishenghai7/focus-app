/**
 * Comment likes — authenticated Supabase + REST fallback.
 */
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { getAuthToken } from './supabaseRest';

const authHeaders = async () => {
  const token = await getAuthToken();
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export async function setCommentLiked(commentId, userId, shouldLike) {
  if (!shouldLike) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('comment_likes').insert({
    comment_id: commentId,
    user_id: userId,
  });
  if (error) {
    const msg = `${error.message || ''}${error.code || ''}`;
    if (!/23505|duplicate/i.test(msg)) throw error;
  }
}

export async function fetchUserLikedCommentIds(userId, commentIds) {
  if (!userId || !commentIds?.length) return new Set();
  const { data, error } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('user_id', userId)
    .in('comment_id', commentIds);
  if (error) return new Set();
  return new Set((data || []).map((r) => r.comment_id).filter(Boolean));
}

/** Bump likes_count on comments row (when no DB trigger). Best-effort. */
export async function bumpCommentLikeCount(commentId, delta) {
  const { data: row } = await supabase
    .from('post_comments')
    .select('likes_count')
    .eq('id', commentId)
    .maybeSingle();
  const next = Math.max(0, (row?.likes_count || 0) + delta);
  await supabase.from('post_comments').update({ likes_count: next }).eq('id', commentId);
}
