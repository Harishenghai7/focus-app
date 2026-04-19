const FALLBACK_SEED = 'FocuslyMascot';

export const buildFallbackAvatar = (seed) =>
  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || FALLBACK_SEED)}`;

const buildFallbackUsername = (userId) => {
  if (!userId) return 'focusly_user';
  return `focusly_${String(userId).slice(0, 8)}`;
};

export const normalizeHydratedProfile = (profile, userId, metadata = null) => {
  const baseHandle =
    profile?.username ||
    metadata?.preferred_username ||
    metadata?.user_name ||
    metadata?.username ||
    buildFallbackUsername(userId);

  const avatarCandidate =
    profile?.avatar_url ||
    metadata?.avatar_url ||
    metadata?.picture ||
    null;

  return {
    id: profile?.id || userId || null,
    username: baseHandle,
    full_name: profile?.full_name || metadata?.full_name || metadata?.name || baseHandle,
    avatar_url: avatarCandidate || buildFallbackAvatar(baseHandle || userId),
    is_verified: Boolean(profile?.is_verified || (profile?.trust_tier || 0) >= 4),
    trust_tier: typeof profile?.trust_tier === 'number' ? profile.trust_tier : 0,
  };
};

