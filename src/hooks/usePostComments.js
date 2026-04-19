/**
 * Post comments with nested replies + profile batching.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const postCommentsQueryKey = (postId) => ['post-comments', postId];

const PROFILE_FIELDS = 'id, username, full_name, avatar_url, is_verified';

const normalizeCommentRow = (row) => {
  if (!row) return row;
  const body = row.content ?? row.text ?? '';
  const parent = row.parent_id ?? row.parent_comment_id ?? null;
  const rawProf = row.profiles;
  let profiles = Array.isArray(rawProf) ? rawProf[0] : rawProf;
  if (profiles && typeof profiles === 'object') {
    profiles = {
      ...profiles,
      is_verified: profiles.is_verified ?? profiles.verified ?? false,
    };
  }

  return {
    ...row,
    content: body,
    parent_id: parent,
    profiles,
    likes_count: row.likes_count ?? 0,
  };
};

const attachMissingProfiles = async (rows) => {
  if (!rows?.length) return rows;
  const need = rows.filter((r) => {
    if (!r.user_id) return false;
    const p = r.profiles;
    if (!p) return true;
    return !(p.username || p.full_name || p.avatar_url);
  });
  if (!need.length) return rows;
  const ids = [...new Set(need.map((r) => r.user_id))];
  const { data: profs, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .in('id', ids);
  if (error || !profs?.length) return rows;
  const map = Object.fromEntries(profs.map((p) => [p.id, p]));
  return rows.map((r) =>
    r.profiles || !map[r.user_id] ? r : { ...r, profiles: map[r.user_id] }
  );
};

/** Nest flat comments into trees (root comments + childReplies[]). */
const nestComments = (flat) => {
  const withChildren = flat.map((c) => ({ ...c, childReplies: [] }));
  const byId = Object.fromEntries(withChildren.map((c) => [c.id, c]));
  const roots = [];
  withChildren.forEach((c) => {
    const pid = c.parent_id;
    if (pid && byId[pid]) {
      byId[pid].childReplies.push(c);
    } else if (!pid) {
      roots.push(c);
    } else {
      // Orphan reply (missing parent row) — show at root so it is not lost
      roots.push(c);
    }
  });
  const sortByTime = (a, b) =>
    new Date(a.created_at || 0) - new Date(b.created_at || 0);
  roots.sort(sortByTime);
  roots.forEach((r) => r.childReplies.sort(sortByTime));
  return roots;
};

export function usePostComments(postId, { enabled = true } = {}) {
  return useQuery({
    queryKey: postCommentsQueryKey(postId),
    queryFn: async () => {
      const embedded = await supabase
        .from('post_comments')
        .select(
          `
          *,
          profiles:user_id (${PROFILE_FIELDS})
        `
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(200);

      let rows = embedded.data;
      if (embedded.error) {
        const plain = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
          .limit(200);
        if (plain.error) throw plain.error;
        rows = plain.data;
      }

      let normalized = (rows || []).map(normalizeCommentRow);
      normalized = await attachMissingProfiles(normalized);
      return nestComments(normalized);
    },
    enabled: Boolean(postId) && enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useInvalidatePostComments() {
  const qc = useQueryClient();
  return (postId) => {
    if (postId) qc.invalidateQueries({ queryKey: postCommentsQueryKey(postId) });
  };
}
