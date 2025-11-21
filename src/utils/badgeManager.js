import { supabase } from '../supabaseClient';

// In-memory cache (simple; could be replaced by something like react-query or SWR externally)
const _cache = {
  userBadges: new Map(), // key: userId -> { data, ts }
  primaryBadge: new Map(), // key: userId -> { data, ts }
  badgeProgress: new Map(), // key: userId -> { data, ts }
};
const CACHE_TTL_MS = 60_000; // 1 minute default TTL

function _isFresh(entry) {
  return entry && (Date.now() - entry.ts < CACHE_TTL_MS);
}

async function getUserBadges(userId, { forceRefresh = false } = {}) {
  if (!userId) return [];
  const cached = _cache.userBadges.get(userId);
  if (!forceRefresh && _isFresh(cached)) return cached.data;

  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('display_priority', { ascending: true });

  if (error) {
    console.error('getUserBadges error', error);
    return [];
  }
  _cache.userBadges.set(userId, { data, ts: Date.now() });
  return data || [];
}

async function getPrimaryBadge(userId, { forceRefresh = false } = {}) {
  if (!userId) return null;
  const cached = _cache.primaryBadge.get(userId);
  if (!forceRefresh && _isFresh(cached)) return cached.data;

  const { data, error } = await supabase.rpc('get_primary_badge', { p_user_id: userId });
  if (error) {
    console.error('getPrimaryBadge error', error);
    return null;
  }
  _cache.primaryBadge.set(userId, { data, ts: Date.now() });
  return data || null;
}

async function checkBadgeEligibility(userId) {
  if (!userId) return { eligible: [], awarded: [] };
  const { data, error } = await supabase.rpc('check_badge_eligibility', { p_user_id: userId });
  if (error) {
    console.error('checkBadgeEligibility error', error);
    return { eligible: [], awarded: [] };
  }
  // data: { eligible: string[], already_awarded: string[] }
  const eligible = data?.eligible || [];
  const awarded = [];
  for (const badgeKey of eligible) {
    const res = await awardBadge(userId, badgeKey, 'Eligibility auto-award');
    if (res.success) awarded.push(badgeKey);
  }
  return { eligible, awarded };
}

async function awardBadge(userId, badgeKey, reason = '') {
  if (!userId || !badgeKey) return { success: false, error: 'Missing params' };
  const { data, error } = await supabase.rpc('award_badge', { p_user_id: userId, p_badge_key: badgeKey, p_reason: reason });
  if (error) {
    console.warn('awardBadge error', error.message);
    return { success: false, error: error.message };
  }
  _invalidateUser(userId);
  await _logBadgeEvent(userId, badgeKey, 'AWARD', reason);
  await _notifyUser(userId, `You earned the ${badgeKey} badge!`);
  return { success: true, data };
}

async function revokeBadge(userId, badgeKey, reason = '') {
  if (!userId || !badgeKey) return { success: false, error: 'Missing params' };
  const { data, error } = await supabase.rpc('revoke_badge', { p_user_id: userId, p_badge_key: badgeKey, p_reason: reason });
  if (error) {
    console.warn('revokeBadge error', error.message);
    return { success: false, error: error.message };
  }
  _invalidateUser(userId);
  await _logBadgeEvent(userId, badgeKey, 'REVOKE', reason);
  await _notifyUser(userId, `Your ${badgeKey} badge was revoked. Reason: ${reason}`);
  return { success: true, data };
}

async function getBadgeProgress(userId, { forceRefresh = false } = {}) {
  if (!userId) return {};
  const cached = _cache.badgeProgress.get(userId);
  if (!forceRefresh && _isFresh(cached)) return cached.data;
  const { data, error } = await supabase
    .from('badge_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('getBadgeProgress error', error);
    return {};
  }
  const map = {};
  data.forEach(row => {
    map[row.badge_type] = {
      progress_percent: row.progress_percent ?? 0,
      earned_at: row.earned_at || null,
      requirements_status: row.requirements_status || {}
    };
  });
  _cache.badgeProgress.set(userId, { data: map, ts: Date.now() });
  return map;
}

async function updateBadgeProgress(userId) {
  if (!userId) return { updated: [], autoAwarded: [] };
  // Assuming postgres function handles recalculation
  const { data, error } = await supabase.rpc('recalculate_badge_progress', { p_user_id: userId });
  if (error) {
    console.error('updateBadgeProgress error', error);
    return { updated: [], autoAwarded: [] };
  }
  // data could contain { updated: string[], completed: string[] }
  const updated = data?.updated || [];
  const completed = data?.completed || [];
  const autoAwarded = [];
  for (const badgeKey of completed) {
    const res = await awardBadge(userId, badgeKey, '100% progress auto-award');
    if (res.success) autoAwarded.push(badgeKey);
  }
  _invalidateUser(userId);
  return { updated, autoAwarded };
}

async function applyForBadge(userId, badgeKey, applicationData = {}, files = {}) {
  if (!userId || !badgeKey) return { success: false, error: 'Missing params' };
  // Upload files first
  const uploadedPaths = {};
  for (const [field, file] of Object.entries(files)) {
    const path = `${userId}/${badgeKey}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('badge-docs').upload(path, file);
    if (uploadError) {
      console.error('applyForBadge upload error', uploadError);
      return { success: false, error: `Upload failed for ${field}` };
    }
    uploadedPaths[field] = path;
  }
  const { data, error } = await supabase.from('badge_applications').insert({
    user_id: userId,
    badge_type: badgeKey,
    data: applicationData,
    files: uploadedPaths,
    status: 'submitted'
  }).select('id').single();
  if (error) {
    console.error('applyForBadge error', error);
    return { success: false, error: error.message };
  }
  await _logBadgeEvent(userId, badgeKey, 'APPLY', 'Application submitted');
  await _notifyAdmins(`New badge application for ${badgeKey} from user ${userId}`);
  return { success: true, applicationId: data.id };
}

async function setBadgePrimary(userId, badgeId) {
  if (!userId || !badgeId) return { success: false, error: 'Missing params' };
  // Transaction-like sequence: unset others, set this one
  const { error: unsetError } = await supabase
    .from('user_badges')
    .update({ is_primary: false })
    .eq('user_id', userId);
  if (unsetError) {
    console.error('setBadgePrimary unset error', unsetError);
    return { success: false, error: unsetError.message };
  }
  const { error: setError } = await supabase
    .from('user_badges')
    .update({ is_primary: true })
    .eq('user_id', userId)
    .eq('id', badgeId);
  if (setError) {
    console.error('setBadgePrimary set error', setError);
    return { success: false, error: setError.message };
  }
  _invalidateUser(userId);
  await _logBadgeEvent(userId, badgeId, 'PRIMARY_SET', 'User changed primary badge');
  return { success: true };
}

async function getBadgeHolders(badgeKey, limit = 10) {
  if (!badgeKey) return [];
  const { data, error } = await supabase
    .from('user_badges')
    .select('user_id, earned_at, user_profiles(id, username, avatar_url)')
    .eq('badge_key', badgeKey)
    .eq('active', true)
    .order('earned_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getBadgeHolders error', error);
    return [];
  }
  return data || [];
}

// Helpers --------------------------------------------------------------
function _invalidateUser(userId) {
  _cache.userBadges.delete(userId);
  _cache.primaryBadge.delete(userId);
  _cache.badgeProgress.delete(userId);
}

async function _logBadgeEvent(userId, badgeRef, action, reason = '') {
  try {
    await supabase.from('badge_events').insert({ user_id: userId, badge_ref: badgeRef, action, reason });
  } catch (e) {
    console.warn('logBadgeEvent failed', e);
  }
}

async function _notifyUser(userId, message) {
  try {
    await supabase.from('notifications').insert({ user_id: userId, type: 'badge', message });
  } catch (e) {
    console.warn('notifyUser failed', e);
  }
}

async function _notifyAdmins(message) {
  try {
    await supabase.from('admin_notifications').insert({ message, type: 'badge_application' });
  } catch (e) {
    console.warn('notifyAdmins failed', e);
  }
}

export {
  getUserBadges,
  getPrimaryBadge,
  checkBadgeEligibility,
  awardBadge,
  revokeBadge,
  getBadgeProgress,
  updateBadgeProgress,
  applyForBadge,
  setBadgePrimary,
  getBadgeHolders
};
