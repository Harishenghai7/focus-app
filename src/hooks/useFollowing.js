import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useFollowing = (userId) => {
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        const fetchFollowing = async () => {
            if (!userId) return;

            setLoading(true);


            try {
                // 1. Get Config
                const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://nmhrtllprmonqqocwzvf.supabase.co';
                const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || supabase.supabaseKey;

                // 2. Get Token (Try localStorage directly)
                let token = null;
                try {
                    const sessionPromise = supabase.auth.getSession();
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 2000));
                    const { data } = await Promise.race([sessionPromise, timeoutPromise]);
                    token = data?.session?.access_token;
                } catch (e) {
                    console.warn('⚠️ [Following] Session timeout, trying localStorage');
                }

                if (!token) {
                    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
                    const stored = localStorage.getItem(storageKey);
                    if (stored) {
                        try {
                            token = JSON.parse(stored).access_token;
                        } catch (e) { }
                    }
                }

                if (!token) throw new Error('Not authenticated');

                // 3. Fetch Follows

                const followsUrl = `${supabaseUrl}/rest/v1/follows?follower_id=eq.${userId}&select=following_id,created_at`;

                const followsRes = await fetch(followsUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    signal: abortController.signal
                });

                if (!followsRes.ok) throw new Error(`Fetch error: ${followsRes.status}`);

                const followsData = await followsRes.json();


                if (followsData.length === 0) {
                    if (isMounted) {
                        setFollowing([]);
                        setLoading(false);
                    }
                    return;
                }

                // 4. Fetch Profiles
                const ids = followsData.map(f => f.following_id).join(',');
                const profilesUrl = `${supabaseUrl}/rest/v1/profiles?id=in.(${ids})&select=id,username,full_name,avatar_url,verified`;

                const profilesRes = await fetch(profilesUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    signal: abortController.signal
                });

                if (!profilesRes.ok) throw new Error(`Profiles error: ${profilesRes.status}`);

                const profilesData = await profilesRes.json();


                // 5. Combine
                const combined = followsData.map(f => {
                    const p = profilesData.find(profile => profile.id === f.following_id);
                    return p ? { ...p, followed_at: f.created_at } : null;
                }).filter(Boolean);

                if (isMounted) {
                    setFollowing(combined);
                    setLoading(false);
                }

            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('❌ [Following] Error:', err);
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        fetchFollowing();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [userId]);

    return { following, loading, error, hasMore: false, searchQuery: '', setSearchQuery: () => { }, loadMore: () => { }, updateFollowingStatus: () => { }, unfollowUser: () => { }, refresh: () => { } };
};
