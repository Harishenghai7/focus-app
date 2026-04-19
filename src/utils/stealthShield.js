/**
 * stealthShield.js
 * ================
 * Profile visibility logic — automatically hides teen profiles
 * from unverified adults. Privacy-first design.
 *
 * Visibility Matrix:
 *   Verified Guardian of teen → Full access
 *   Verified Adult (non-contact) → HIDDEN
 *   Unverified Adult → HIDDEN
 *   Other Teen → Full access
 *
 * H2 Innovative — Teen Care
 */

import { supabase } from '../lib/supabase';

/**
 * Check whether the viewer can see a teen's profile
 * @param {string} viewerId   - ID of the person viewing
 * @param {string} teenId     - ID of the teen being viewed
 * @returns {Promise<{visible: boolean, reason: string}>}
 */
export const canViewTeenProfile = async (viewerId, teenId) => {
  if (!viewerId || !teenId) return { visible: false, reason: 'invalid_ids' };
  if (viewerId === teenId) return { visible: true, reason: 'self' };

  try {
    // 1. Get viewer profile
    const { data: viewer } = await supabase
      .from('profiles')
      .select('age, is_teen, verification_status, account_status')
      .eq('id', viewerId)
      .single();

    if (!viewer) return { visible: false, reason: 'viewer_not_found' };

    // Unverified users cannot see teen profiles
    if (viewer.verification_status !== 'VERIFIED') {
      return { visible: false, reason: 'viewer_unverified' };
    }

    // If viewer is also a teen → full access (peer-to-peer is allowed)
    if (viewer.is_teen) return { visible: true, reason: 'peer_teen' };

    // Adult viewer: check if they're a verified guardian of this teen
    const { data: guardianRel } = await supabase
      .from('guardian_relationships')
      .select('id, status')
      .eq('guardian_id', viewerId)
      .eq('teen_id', teenId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (guardianRel) return { visible: true, reason: 'verified_guardian' };

    // Check if teen has explicitly allowed this adult
    const { data: trustedContact } = await supabase
      .from('trusted_contacts')
      .select('id')
      .eq('user_id', teenId)
      .eq('trusted_id', viewerId)
      .limit(1)
      .single();

    if (trustedContact) return { visible: true, reason: 'trusted_contact' };

    // Default: adult cannot see teen profile (Stealth Shield active)
    return { visible: false, reason: 'stealth_shield_active' };

  } catch (err) {
    console.error('[StealthShield]', err.message);
    // Fail safe — hide the profile
    return { visible: false, reason: 'error_fail_safe' };
  }
};

/**
 * Filter a list of profiles/posts, removing teen content
 * from adult viewers who don't have access
 * @param {string} viewerId
 * @param {Array} items - Array of posts/profiles with user_id or id field
 * @param {string} [idField='user_id']
 */
export const filterStealthContent = async (viewerId, items, idField = 'user_id') => {
  if (!viewerId || !items?.length) return items;

  try {
    // Get viewer info
    const { data: viewer } = await supabase
      .from('profiles')
      .select('is_teen, verification_status')
      .eq('id', viewerId)
      .single();

    if (!viewer) return [];
    if (viewer.is_teen) return items; // Teens can see everything in normal feed
    if (viewer.verification_status !== 'VERIFIED') {
      // Unverified adults: remove ALL teen content
      const teenIds = await getAllTeenIds();
      return items.filter(item => !teenIds.has(item[idField]));
    }

    // Verified adult: filter out teen profiles they don't have access to
    const teenIds = await getAllTeenIds();
    const teenItemIds = [...new Set(
      items.filter(i => teenIds.has(i[idField])).map(i => i[idField])
    )];

    if (teenItemIds.length === 0) return items;

    // Check access for each teen
    const accessResults = await Promise.all(
      teenItemIds.map(teenId => canViewTeenProfile(viewerId, teenId))
    );

    const allowedTeenIds = new Set(
      teenItemIds.filter((_, idx) => accessResults[idx].visible)
    );

    return items.filter(item => {
      const userId = item[idField];
      if (teenIds.has(userId)) return allowedTeenIds.has(userId);
      return true; // Non-teen content always visible
    });

  } catch (err) {
    console.error('[StealthShield] Filter error:', err.message);
    return items;
  }
};

// Cache teen IDs to avoid repeated queries
let teenIdCache = null;
let cacheExpiry = 0;

const getAllTeenIds = async () => {
  const now = Date.now();
  if (teenIdCache && now < cacheExpiry) return teenIdCache;

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_teen', true);

  const set = new Set((data || []).map(p => p.id));
  teenIdCache = set;
  cacheExpiry = now + 5 * 60 * 1000; // Cache for 5 minutes
  return set;
};

const _defaultModule = { canViewTeenProfile, filterStealthContent };


export default _defaultModule;
