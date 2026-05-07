/**
 * useStrikeSystem.js
 * ==================
 * Automated 3-strike enforcement system
 * Strike 1 → Warning
 * Strike 2 → 24h Ghost Protocol (shadow-ban)
 * Strike 3 → Permanent Quarantine
 *
 * H2 Innovative — Content Constitution
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

const STRIKE_ACTIONS = {
  1: 'warning',
  2: 'shadow_ban',
  3: 'quarantine',
};

const SHADOW_BAN_DURATION_HOURS = 24;

export const useStrikeSystem = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  /**
   * Get current strike count for a user
   */
  const getStrikeCount = useCallback(async (userId = user?.id) => {
    if (!userId) return 0;
    const { data, error } = await supabase
      .from('content_strikes')
      .select('id')
      .eq('user_id', userId);
    if (error) return 0;
    return data?.length || 0;
  }, [user?.id]);

  /**
   * Record a strike and enforce action
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.reason           - Human-readable reason
   * @param {string} params.violationType    - 'nsfw', 'hate_speech', 'violence', etc.
   * @param {string} params.contentSnapshot  - Truncated offending content
   * @param {string} params.geminiExplanation- AI-generated educational explanation
   * @param {string} [params.contentId]      - ID of the blocked content
   * @param {string} [params.contentType]    - 'post', 'comment', 'boltz'
   */
  const recordStrike = useCallback(async ({
    userId,
    reason,
    violationType,
    contentSnapshot = '',
    geminiExplanation = '',
    contentId = null,
    contentType = 'post',
  }) => {
    if (!userId) return { success: false, error: 'No user ID' };

    setProcessing(true);
    try {
      // 1. Count existing strikes
      const existingCount = await getStrikeCount(userId);
      const newStrikeNumber = existingCount + 1;
      const action = STRIKE_ACTIONS[Math.min(newStrikeNumber, 3)];

      // 2. Determine shadow ban expiry if applicable
      const shadowBanUntil = action === 'shadow_ban'
        ? new Date(Date.now() + SHADOW_BAN_DURATION_HOURS * 60 * 60 * 1000).toISOString()
        : null;

      // 3. Insert strike record
      const { error: strikeError } = await supabase
        .from('content_strikes')
        .insert({
          user_id: userId,
          strike_number: newStrikeNumber,
          reason,
          violation_type: violationType,
          content_id: contentId,
          content_type: contentType,
          content_snapshot: contentSnapshot.slice(0, 500),
          action_taken: action,
          shadow_ban_until: shadowBanUntil,
          gemini_explanation: geminiExplanation,
        });

      if (strikeError) throw strikeError;

      // 4. Enforce on user profile
      const profileUpdates = {
        strike_count: newStrikeNumber,
        updated_at: new Date().toISOString(),
      };

      if (action === 'shadow_ban') {
        profileUpdates.account_status = 'SHADOW_BANNED';
        profileUpdates.shadow_banned_until = shadowBanUntil;
      } else if (action === 'quarantine') {
        profileUpdates.account_status = 'QUARANTINED';
        profileUpdates.shadow_banned_until = null;
        profileUpdates.is_restricted = true;
      }

      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      // 5. Return result with action details
      const result = {
        success: true,
        strikeNumber: newStrikeNumber,
        action,
        shadowBanUntil,
        isQuarantined: action === 'quarantine',
        isShadowBanned: action === 'shadow_ban',
      };

      if (action === 'quarantine') {
        toast.error(
          "Macha, you've reached 3 strikes. Your voice is being silenced for 24 hours to protect the Nation's peace. Reflect and return with Focus.",
          { autoClose: 6000 }
        );
      }

      return result;
    } catch (err) {
      console.error('[StrikeSystem] Error recording strike:', err);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, [user?.id, getStrikeCount]);

  /**
   * Check if the current user can post (not shadow-banned or quarantined)
   * Returns { canPost, reason, accountStatus }
   */
  const checkPostPermission = useCallback(async (userId = user?.id) => {
    if (!userId) return { canPost: false, reason: 'Not authenticated' };

    const { data, error } = await supabase
      .from('profiles')
      .select('account_status, shadow_banned_until, strike_count, is_restricted')
      .eq('id', userId)
      .single();

    if (error || !data) return { canPost: true, accountStatus: 'ACTIVE' };

    const status = data.account_status || 'ACTIVE';

    if (data.is_restricted) {
      return {
        canPost: false,
        accountStatus: status,
        reason: 'Your account is restricted due to repeated violations of the Focus Constitution.',
      };
    }

    if (status === 'QUARANTINED') {
      return {
        canPost: false,
        accountStatus: status,
        reason: 'Your account has been permanently quarantined due to repeated violations of the Focus Constitution.',
      };
    }

    if (status === 'SHADOW_BANNED') {
      const banUntil = new Date(data.shadow_banned_until);
      const now = new Date();
      if (now < banUntil) {
        const hoursLeft = Math.ceil((banUntil - now) / (1000 * 60 * 60));
        // Ghost Protocol: user can "post" but content is invisible
        // We still allow the API call to succeed — just mark content as ghost
        return {
          canPost: true,
          isGhost: true,   // ← Content saved but invisible to others
          accountStatus: status,
          shadowBanExpiresAt: data.shadow_banned_until,
          reason: `Ghost Protocol active. Your content is not visible to others. Lifts in ${hoursLeft}h.`,
        };
      } else {
        // Ban expired — lift it
        await supabase
          .from('profiles')
          .update({ account_status: 'ACTIVE', shadow_banned_until: null })
          .eq('id', userId);
        return { canPost: true, accountStatus: 'ACTIVE', isGhost: false };
      }
    }

    return { canPost: true, accountStatus: status, strikeCount: data.strike_count };
  }, [user?.id]);

  /**
   * Acknowledge a strike's educational content
   */
  const acknowledgeStrike = useCallback(async (strikeId) => {
    await supabase
      .from('content_strikes')
      .update({ educational_acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', strikeId);
  }, []);

  return {
    processing,
    recordStrike,
    getStrikeCount,
    checkPostPermission,
    acknowledgeStrike,
  };
};

export default useStrikeSystem;
