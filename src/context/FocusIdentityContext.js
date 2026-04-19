/**
 * FocusIdentityContext — Focus App
 * 
 * Single source of truth for the authenticated user's visual identity.
 * Consumes AuthContext and exposes a clean useFocusIdentity() hook.
 * 
 * Usage:
 *   const { avatarUrl, displayName, handle, isVerified, refreshIdentity } = useFocusIdentity();
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useFocusUser } from './FocusUserContext';
import { getUserAvatarUrl } from '../utils/avatarManager';
import { pickDisplayLabel } from '../utils/displayName';

/** Merge DB profile onto auth-computed profile without blank DB fields wiping OAuth fallbacks. */
const mergeProfiles = (authProfile, dbProfile) => {
    if (!dbProfile) return authProfile ?? null;
    if (!authProfile) return dbProfile;
    const out = { ...authProfile };
    for (const [k, v] of Object.entries(dbProfile)) {
        if (v === null || v === undefined) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        out[k] = v;
    }
    return out;
};

/* ─────────────────────────────────────────────── */
const FocusIdentityContext = createContext({
    avatarUrl: null,
    displayName: '',
    handle: '',
    isVerified: false,
    userId: null,
    profile: null,
    refreshIdentity: () => {},
});

/* ─────────────────────────────────────────────── */
export const FocusIdentityProvider = ({ children }) => {
    const { user, profile, refreshProfile } = useAuth();
    const focusUser = useFocusUser();

    const value = useMemo(() => {
        const mergedUser = focusUser.user ?? user ?? null;
        const mergedProfile = mergeProfiles(profile, focusUser.profile);

        if (!mergedUser?.id) {
            return {
                avatarUrl: null,
                displayName: '',
                handle: '',
                isVerified: false,
                userId: null,
                profile: null,
                refreshIdentity: async () => {},
            };
        }

        const avatarUrl = getUserAvatarUrl(mergedUser, mergedProfile);

        const handle =
            mergedProfile?.username ||
            mergedUser.user_metadata?.preferred_username ||
            mergedUser.user_metadata?.user_name ||
            mergedUser.user_metadata?.username ||
            mergedUser.email?.split('@')[0] ||
            `user_${mergedUser.id.slice(0, 8)}`;

        const displayName = pickDisplayLabel(
            mergedProfile?.full_name ||
                mergedUser.user_metadata?.full_name ||
                mergedUser.user_metadata?.name,
            handle,
            handle
        );

        const isVerified =
            mergedProfile?.is_verified === true ||
            (mergedProfile?.trust_tier || 0) >= 4;

        return {
            avatarUrl,
            displayName,
            handle,
            isVerified,
            userId: mergedUser.id,
            profile: mergedProfile,
            refreshIdentity: async () => {
                await focusUser.refreshProfile?.(mergedUser.id);
                await refreshProfile?.();
            },
        };
    }, [focusUser, user, profile, refreshProfile]);

    return (
        <FocusIdentityContext.Provider value={value}>
            {children}
        </FocusIdentityContext.Provider>
    );
};

/* ─────────────────────────────────────────────── */
// This fulfills the "Construct useFocusIdentity.js for global avatar/verification single-fetch"
export const useFocusIdentity = () => useContext(FocusIdentityContext);

export default FocusIdentityContext;
