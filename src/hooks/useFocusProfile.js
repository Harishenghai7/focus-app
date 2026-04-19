import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeHydratedProfile } from '../utils/identityHydration';

export const useFocusProfile = (userId, initialProfile = null) => {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If the caller already provided a full profile, use it
    if (initialProfile?.username || initialProfile?.full_name) {
      setProfile(initialProfile);
      setLoading(false);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error: pbError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified, trust_tier')
          .eq('id', userId)
          .maybeSingle();

        if (pbError && pbError.code !== 'PGRST116') {
           throw pbError;
        }

        if (mounted) {
          if (data?.id) {
             setProfile(normalizeHydratedProfile(data, userId));
          } else {
             setProfile(normalizeHydratedProfile(null, userId));
          }
        }
      } catch (err) {
        if (mounted) {
           setError(err);
           setProfile(normalizeHydratedProfile(null, userId));
        }
        console.warn('useFocusProfile Error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [userId, initialProfile]);

  // Provide guaranteed defaults if the profile is loaded but missing specific properties
  const safeProfile = useMemo(
    () => normalizeHydratedProfile(profile, userId),
    [profile, userId]
  );

  return { profile: safeProfile, loading, error };
};
