import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// 1. Create Context
const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// 2. Export Hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // A. Fetch Profile Helper
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data?.is_banned) {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        return;
      }
      if (data) setProfile(data);
    } catch (err) {
      console.warn('Profile fetch warning:', err);
    }
  }, []);

  // B. Manual refresh — exposed to consumers (e.g. after editing profile/avatar)
  const refreshProfile = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) await fetchProfile(currentUser.id);
    } catch (err) {
      console.warn('refreshProfile error:', err);
    }
  }, [fetchProfile]);

  // B2. Sync OAuth Data
  const syncOAuthToProfile = useCallback(async (userObj) => {
    if (!userObj) return;
    try {
      const { user_metadata, identities } = userObj;
      const oAuthIdentity = identities?.find(id => ['google', 'github', 'discord'].includes(id.provider));

      let avatar_url = user_metadata?.avatar_url || user_metadata?.picture;
      let full_name = user_metadata?.full_name || user_metadata?.name;
      let username = user_metadata?.user_name || user_metadata?.preferred_username;

      if (oAuthIdentity?.identity_data) {
         if (!avatar_url) avatar_url = oAuthIdentity.identity_data.avatar_url || oAuthIdentity.identity_data.picture;
         if (!full_name) full_name = oAuthIdentity.identity_data.full_name || oAuthIdentity.identity_data.name;
         if (!username) username = oAuthIdentity.identity_data.user_name || oAuthIdentity.identity_data.preferred_username;
      }

      if (!username && full_name) {
          username = full_name.replace(/\s+/g, '_').toLowerCase() + Math.floor(Math.random()*(999-100+1)+100);
      }

      if (avatar_url || full_name || username) {
        const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', userObj.id).single();
        let updates = {};
        const isDefaultAvatar = !existingProfile?.avatar_url || existingProfile.avatar_url.includes('dicebear') || existingProfile.avatar_url === '';
        if (avatar_url && isDefaultAvatar) updates.avatar_url = avatar_url;
        if (full_name && (!existingProfile?.full_name || existingProfile.full_name === '' || existingProfile.full_name === 'Focus User')) updates.full_name = full_name;
        if (username && (!existingProfile?.username || existingProfile.username.startsWith('user_'))) updates.username = username;

        if (Object.keys(updates).length > 0) {
           await supabase.from('profiles').upsert({ id: userObj.id, updated_at: new Date().toISOString(), ...existingProfile, ...updates });
        }
      }
    } catch (err) {
      console.warn("syncOAuthToProfile error:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // C. Initialize Session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted && initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await syncOAuthToProfile(initialSession.user);
          fetchProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('Auth Init Error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // D. Listen for Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (newSession?.user) {
          syncOAuthToProfile(newSession.user).then(() => {
             fetchProfile(newSession.user.id);
          });
        } else {
          setProfile(null);
        }
      }
    });

    // E. Safety net — force loading false after 3s
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // F. Realtime profile sync — listens for profile row updates (avatar, username, etc.)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-sync:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            if (payload.new.is_banned) {
              supabase.auth.signOut();
              setProfile(null);
              setUser(null);
              setSession(null);
              return;
            }
            setProfile(prev => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const computedProfile = useMemo(() => {
    if (!user) return null;
    const fallbackAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id || 'Focusly'}`;
    return {
      ...(profile || {}),
      avatar_url: profile?.avatar_url && !profile.avatar_url.includes('dicebear') && profile.avatar_url !== '' 
          ? profile.avatar_url 
          : fallbackAvatar,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Focus User',
      username: profile?.username || user.user_metadata?.user_name || user.user_metadata?.preferred_username || `focusly_${(user.id || 'abc').substring(0, 8)}`
    };
  }, [profile, user]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    profile: computedProfile,
    signOut: () => supabase.auth.signOut(),
    refreshProfile,
  }), [user, session, loading, computedProfile, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #1a0f2e)',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid rgba(139,92,246,0.15)',
            borderTopColor: '#8b5cf6',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: 'var(--text-muted, #a78bfa)', fontSize: 14, fontFamily: 'inherit' }}>
            Loading Focus...
          </span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};