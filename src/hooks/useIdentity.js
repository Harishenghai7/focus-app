import { useMemo } from 'react';
import { useFocusUser } from '../context/FocusUserContext';
import { normalizeHydratedProfile } from '../utils/identityHydration';

export const useIdentity = () => {
  const { user, profile, identity, loading, error, refreshProfile } = useFocusUser();

  const hydratedProfile = useMemo(
    () => normalizeHydratedProfile(profile, user?.id, user?.user_metadata || null),
    [profile, user]
  );

  return {
    userId: user?.id || null,
    profile: hydratedProfile,
    avatarUrl: hydratedProfile.avatar_url,
    handle: hydratedProfile.username,
    displayName: hydratedProfile.full_name,
    isVerified: hydratedProfile.is_verified,
    loading,
    error,
    refreshIdentity: () => refreshProfile?.(user?.id),
    // Preserve previous context-computed identity for compatibility during rollout.
    rawIdentity: identity || null,
  };
};

export default useIdentity;

