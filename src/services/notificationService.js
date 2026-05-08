/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Notification Intelligence Service — Focus Sovereign Ecosystem
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Central brain for the notification ecosystem.
 *
 * Responsibilities:
 *   1. Priority Classification (4-tier: critical → low)
 *   2. Smart Grouping (coalesce rapid-fire events)
 *   3. Quiet Mode filtering (suppress non-critical banners)
 *   4. Focus Mode filtering (only safety alerts)
 *   5. Digest batching (collect low-priority into summaries)
 *   6. Quiet Hours scheduling
 *
 * Philosophy: Notifications must REDUCE stress, not add to it.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   PRIORITY TIERS
   ═══════════════════════════════════════════════════════════════════════════ */

export const PRIORITY = {
  CRITICAL: 'critical',  // Safety & security — ALWAYS delivered
  HIGH: 'high',          // Trust events, direct interactions (follows, DMs)
  MEDIUM: 'medium',      // Social engagement (likes, comments, shares)
  LOW: 'low',            // System, passive (story views, highlights)
};

/**
 * Maps notification type → priority tier.
 * This is the core intelligence that prevents spam.
 */
const PRIORITY_MAP = {
  // ── CRITICAL — Non-negotiable, always shown ──────────────
  security_alert:      PRIORITY.CRITICAL,
  suspicious_login:    PRIORITY.CRITICAL,
  account_locked:      PRIORITY.CRITICAL,
  login_new_device:    PRIORITY.CRITICAL,
  teen_alert:          PRIORITY.CRITICAL,
  guardian_action:     PRIORITY.CRITICAL,

  // ── HIGH — Meaningful personal interactions ──────────────
  follow:              PRIORITY.HIGH,
  mention:             PRIORITY.HIGH,
  message:             PRIORITY.HIGH,
  message_request:     PRIORITY.HIGH,
  reply:               PRIORITY.HIGH,
  tag:                 PRIORITY.HIGH,
  badge_granted:       PRIORITY.HIGH,
  trust_level_up:      PRIORITY.HIGH,
  verification_approved: PRIORITY.HIGH,
  focusid_upgrade:     PRIORITY.HIGH,
  password_change:     PRIORITY.HIGH,
  session_revoked:     PRIORITY.HIGH,
  two_factor_enabled:  PRIORITY.HIGH,

  // ── MEDIUM — Social engagement ───────────────────────────
  like:                PRIORITY.MEDIUM,
  comment:             PRIORITY.MEDIUM,
  share:               PRIORITY.MEDIUM,
  boltz_like:          PRIORITY.MEDIUM,
  boltz_comment:       PRIORITY.MEDIUM,
  react:               PRIORITY.MEDIUM,
  vouched:             PRIORITY.MEDIUM,
  trust_level_down:    PRIORITY.MEDIUM,

  // ── LOW — Passive & system ───────────────────────────────
  story_view:          PRIORITY.LOW,
  highlight_view:      PRIORITY.LOW,
  system:              PRIORITY.LOW,
  oauth_linked:        PRIORITY.LOW,
  oauth_unlinked:      PRIORITY.LOW,
  two_factor_disabled: PRIORITY.LOW,
  biometric_changed:   PRIORITY.LOW,
  badge_revoked:       PRIORITY.LOW,
  community_vouched:   PRIORITY.LOW,
  phone_verified:      PRIORITY.LOW,
  verification_rejected: PRIORITY.LOW,
};

/**
 * Get the priority tier for a notification type.
 */
export const getPriority = (type) => PRIORITY_MAP[type] || PRIORITY.LOW;

/**
 * Numeric weight for sorting (higher = more important).
 */
const PRIORITY_WEIGHT = {
  [PRIORITY.CRITICAL]: 1000,
  [PRIORITY.HIGH]:     100,
  [PRIORITY.MEDIUM]:   10,
  [PRIORITY.LOW]:      1,
};

export const getPriorityWeight = (type) => PRIORITY_WEIGHT[getPriority(type)] || 1;

/* ═══════════════════════════════════════════════════════════════════════════
   CATEGORY SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */

export const CATEGORIES = {
  ALL: 'all',
  INTERACTIONS: 'interactions',
  MENTIONS: 'mentions',
  SECURITY: 'security',
  VERIFICATION: 'verification',
};

const CATEGORY_TYPES = {
  interactions: [
    'like', 'comment', 'follow', 'share', 'react',
    'boltz_like', 'boltz_comment', 'message', 'message_request',
    'story_view', 'highlight_view',
  ],
  mentions: [
    'mention', 'tag', 'reply',
  ],
  security: [
    'login_new_device', 'session_revoked', 'suspicious_login',
    'password_change', 'oauth_linked', 'oauth_unlinked',
    'account_locked', 'two_factor_enabled', 'two_factor_disabled',
    'suspicious_activity', 'biometric_changed', 'security_alert',
  ],
  verification: [
    'badge_granted', 'badge_revoked', 'trust_level_up', 'trust_level_down',
    'vouched', 'vouched_received', 'guardian_action', 'teen_alert',
    'government_id_update', 'focusid_upgrade', 'phone_verified',
    'community_vouched', 'digilocker_update', 'verification_approved',
    'verification_rejected', 'parent_consent_granted',
  ],
};

export const getCategory = (type) => {
  for (const [category, types] of Object.entries(CATEGORY_TYPES)) {
    if (types.includes(type)) return category;
  }
  return 'interactions';
};

/* ═══════════════════════════════════════════════════════════════════════════
   QUIET / FOCUS MODE LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Should a banner be shown for this notification given current mode?
 *
 * Focus Mode:  ONLY critical (safety alerts)
 * Quiet Mode:  critical + high
 * Normal:      everything
 */
export const shouldShowBanner = (notification, { focusMode, quietMode }) => {
  const priority = getPriority(notification.type);

  if (focusMode) {
    return priority === PRIORITY.CRITICAL;
  }
  if (quietMode) {
    return priority === PRIORITY.CRITICAL || priority === PRIORITY.HIGH;
  }
  return true;
};

/**
 * Check if current time falls within quiet hours.
 */
export const isWithinQuietHours = (quietHours) => {
  if (!quietHours?.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = (quietHours.start || '22:00').split(':').map(Number);
  const [endH, endM] = (quietHours.end || '07:00').split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight ranges (e.g., 22:00 → 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SMART GROUPING
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Group rapid-fire notifications into coalesced items.
 * E.g., 5 likes on the same post → "Alex and 4 others liked your post"
 *
 * @param {Array} notifications - Raw notification array
 * @returns {Array} Grouped notifications
 */
export const smartGroup = (notifications) => {
  const grouped = [];
  const seen = new Map();

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  sorted.forEach((n) => {
    // Group key: same type + same content target
    const contentKey = n.content_id || n.post_id || n.conversation_id || '';
    const groupKey = contentKey
      ? `${n.type}-${contentKey}`
      : n.id; // Ungroupable: unique key

    if (seen.has(groupKey) && groupKey !== n.id) {
      const existing = seen.get(groupKey);
      existing.group_count = (existing.group_count || 1) + 1;
      if (!existing.grouped_actors) {
        existing.grouped_actors = [existing.actor];
      }
      if (
        existing.grouped_actors.length < 5 &&
        !existing.grouped_actors.find((a) => a?.id === n.actor?.id)
      ) {
        existing.grouped_actors.push(n.actor);
      }
      // Keep unread if ANY in group is unread
      if (!n.is_read) existing.is_read = false;
    } else {
      const item = {
        ...n,
        group_count: 1,
        grouped_actors: [n.actor],
        _priority: getPriority(n.type),
        _priorityWeight: getPriorityWeight(n.type),
      };
      seen.set(groupKey, item);
      grouped.push(item);
    }
  });

  return grouped;
};

/* ═══════════════════════════════════════════════════════════════════════════
   TIME GROUPING (for display sections)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Splits notifications into time-based sections with pinned priority alerts.
 */
export const groupByTime = (notifications) => {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const pinned = [];
  const fresh = [];  // < 1 hour
  const today = [];
  const thisWeek = [];
  const earlier = [];

  notifications.forEach((n) => {
    const d = new Date(n.created_at);
    const priority = getPriority(n.type);
    const hoursSince = (now - d) / (1000 * 60 * 60);

    // Pin critical alerts for 24 hours
    if (priority === PRIORITY.CRITICAL && hoursSince < 24 && !n.is_read) {
      pinned.push({ ...n, isPinned: true });
    } else if (
      priority === PRIORITY.HIGH &&
      ['badge_granted', 'verification_approved', 'focusid_upgrade', 'trust_level_up'].includes(n.type) &&
      hoursSince < 24 &&
      !n.is_read
    ) {
      pinned.push({ ...n, isPinned: true });
    } else if (d > oneHourAgo) {
      fresh.push(n);
    } else if (d >= todayStart) {
      today.push(n);
    } else if (d >= weekStart) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  });

  return { pinned, fresh, today, thisWeek, earlier };
};

/* ═══════════════════════════════════════════════════════════════════════════
   BANNER COALESCING
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Coalesce rapid-fire banners into a single summary banner.
 * If > 3 banners arrive within 10 seconds, merge them.
 */
export const coalesceBanners = (banners, windowMs = 10000) => {
  if (banners.length <= 3) return banners;

  const now = Date.now();
  const recent = banners.filter(
    (b) => now - new Date(b.created_at || Date.now()).getTime() < windowMs
  );

  if (recent.length <= 3) return banners;

  // Coalesce into a summary
  const summary = {
    _id: `coalesced-${now}`,
    type: 'system',
    body: `${recent.length} new notifications`,
    created_at: new Date().toISOString(),
    is_read: false,
    _coalesced: true,
    _coalescedCount: recent.length,
    _coalescedTypes: [...new Set(recent.map((b) => b.type))],
  };

  const kept = banners.filter(
    (b) => !recent.includes(b)
  );

  return [summary, ...kept].slice(0, 3);
};

/* ═══════════════════════════════════════════════════════════════════════════
   HUMAN-READABLE TIME
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Returns a short, human-readable relative time string.
 * "Just now" | "2m" | "1h" | "Yesterday" | "Mon" | "Apr 15"
 */
export const humanTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUPPRESSED COUNT
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Count how many notifications are being suppressed by current mode.
 * Used for "X notifications waiting" pill after exiting focus mode.
 */
export const getSuppressedCount = (notifications, { focusMode, quietMode }) => {
  return notifications.filter((n) => !shouldShowBanner(n, { focusMode, quietMode }) && !n.is_read).length;
};
