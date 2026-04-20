import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { pickDisplayLabel } from '../utils/displayName';
import { normalizeHydratedProfile } from '../utils/identityHydration';

const FALLBACK_AVATAR = `https://api.dicebear.com/7.x/bottts/svg?seed=Focusly`;

const FocusUserContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  signOut: async () => {},
  identity: {
    userId: null,
    avatarUrl: FALLBACK_AVATAR,
    displayName: 'Focusly User',
    handle: 'focusly_user',
    isVerified: false,
  },
});

const toSafeIdentity = (user, profile) => {
  const safeProfile = normalizeHydratedProfile(profile, user?.id, user?.user_metadata || null);
  const seedHandle =
    safeProfile?.username ||
    user?.user_metadata?.preferred_username ||
    user?.user_metadata?.user_name ||
    user?.email?.split('@')?.[0] ||
    `focusly_${(user?.id || 'guest').slice(0, 6)}`;

  const rawAvatar =
    safeProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  // Only use dicebear as last resort
  const avatarUrl =
    rawAvatar && rawAvatar !== '' && !rawAvatar.includes('dicebear')
      ? rawAvatar
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seedHandle)}`;

  return {
    userId: user?.id || null,
    avatarUrl,
    displayName: pickDisplayLabel(
      safeProfile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name,
      seedHandle,
      seedHandle
    ),
    handle: seedHandle,
    isVerified: Boolean(safeProfile?.is_verified || (safeProfile?.trust_tier || 0) >= 4),
  };
};

export const FocusUserProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Stable ref so callbacks never capture stale user ──────────────────
  const userRef = useRef(null);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── syncOAuthProfile — stable, no deps ───────────────────────────────
  const syncOAuthProfile = useCallback(async (authUser) => {
    if (!authUser?.id) return;
    const meta = authUser.user_metadata || {};
    const full_name  = meta.full_name  || meta.name     || null;
    const avatar_url = meta.avatar_url || meta.picture  || null;
    const username   = meta.user_name  || meta.preferred_username || meta.username || null;

    try {
      await supabase.rpc('sync_oauth_profile', {
        p_user_id:    authUser.id,
        p_avatar_url: avatar_url,
        p_full_name:  full_name,
        p_username:   username,
      });
    } catch {
      // RPC may not exist — direct upsert fallback
      await supabase.from('profiles').upsert({
        id:         authUser.id,
        avatar_url: avatar_url || undefined,
        full_name:  full_name  || undefined,
        username:   username   || `focusly_${authUser.id.slice(0, 6)}`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: false });
    }
  }, []);

  // ── refreshProfile — STABLE (no user?.id dep) ─────────────────────────
  // Always receives userId explicitly — this breaks the circular dependency.
  const refreshProfile = useCallback(async (authUserId) => {
    const targetId = authUserId;
    if (!targetId) {
      setProfile(null);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_verified, trust_tier, updated_at, verification_status, trust_shield_status, focus_trust_status, onboarding_completed')
      .eq('id', targetId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError);
      return;
    }
    setProfile(data || null);
  }, []); // ← intentionally empty — userId always passed as argument

  // ── Boot (runs once, no circular deps) ────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const withTimeout = (promise, ms, label = 'Request timed out') =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(label)), ms)),
      ]);

    const boot = async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'Auth session request timed out'
        );
        const activeSession = data?.session || null;
        if (!isMounted) return;

        setSession(activeSession);
        setUser(activeSession?.user || null);

        if (activeSession?.user) {
          // Non-blocking: never hold the whole app on profile sync/fetch.
          // If these hang due to network/RLS issues, the app still renders.
          syncOAuthProfile(activeSession.user)
            .then(() => refreshProfile(activeSession.user.id))
            .catch((err) => isMounted && setError(err));
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    boot();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession || null);
        setUser(nextSession?.user || null);

        if (nextSession?.user) {
          // Non-blocking — don't await so UI updates immediately
          syncOAuthProfile(nextSession.user).then(() =>
            refreshProfile(nextSession.user.id)
          );
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []); // ← stable: syncOAuthProfile & refreshProfile are both empty-dep callbacks

  // ── Realtime profile sync ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`focus-user-profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => setProfile((prev) => ({ ...(prev || {}), ...(payload.new || {}) }))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const updateProfileState = useCallback((newProfileData) => {
    setProfile(prev => ({ ...(prev || {}), ...newProfileData }));
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    error,
    refreshProfile,
    updateProfileState,
    signOut: () => supabase.auth.signOut(),
    identity: toSafeIdentity(user, profile),
  }), [error, loading, profile, refreshProfile, session, updateProfileState, user]);

  return (
    <FocusUserContext.Provider value={value}>
      {children}
    </FocusUserContext.Provider>
  );
};

export const useFocusUser = () => useContext(FocusUserContext);
