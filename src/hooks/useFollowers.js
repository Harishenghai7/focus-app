import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useFollowers = (userId) => {
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        const fetchFollowers = async () => {
            if (!userId) return;

            setLoading(true);
            console.log('🚀 [Followers] Starting fetch for:', userId);

            try {
                // 1. Get Config
                const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://nmhrtllprmonqqocwzvf.supabase.co';
                const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || supabase.supabaseKey;

                console.log('📊 [Followers] Config check:', {
                    hasUrl: !!supabaseUrl,
                    hasKey: !!supabaseKey
                });

                // 2. Get Token (Try localStorage directly to avoid Supabase client hang)
                let token = null;
                console.log('🔑 [Followers] Getting token...');

                // Try getting session from Supabase client first, but with timeout
                try {
                    const sessionPromise = supabase.auth.getSession();
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 2000));
                    const { data } = await Promise.race([sessionPromise, timeoutPromise]);
                    token = data?.session?.access_token;
                } catch (e) {
                    console.warn('⚠️ [Followers] supabase.auth.getSession() timed out or failed, trying localStorage');
                }

                // Fallback to localStorage if needed
                if (!token) {
                    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
                    const stored = localStorage.getItem(storageKey);
                    if (stored) {
                        try {
                            token = JSON.parse(stored).access_token;
                        } catch (e) { console.error('Error parsing token', e); }
                    }
                }

                if (!token) {
                    console.error('❌ [Followers] No token found');
                    throw new Error('Not authenticated');
                }
                console.log('✅ [Followers] Got token');

                // 3. Fetch Follows
                console.log('📡 [Followers] Fetching follows list...');
                const followsUrl = `${supabaseUrl}/rest/v1/follows?following_id=eq.${userId}&select=follower_id,created_at`;

                const followsRes = await fetch(followsUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    signal: abortController.signal
                });

                if (!followsRes.ok) throw new Error(`Follows fetch error: ${followsRes.status}`);

                const followsData = await followsRes.json();
                console.log('✅ [Followers] Follows data:', followsData.length);

                if (followsData.length === 0) {
                    if (isMounted) {
                        setFollowers([]);
                        setLoading(false);
                    }
                    return;
                }

                // 4. Fetch Profiles
                const ids = followsData.map(f => f.follower_id).join(',');
                console.log('📡 [Followers] Fetching profiles...');

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

                if (!profilesRes.ok) throw new Error(`Profiles fetch error: ${profilesRes.status}`);

                const profilesData = await profilesRes.json();
                console.log('✅ [Followers] Profiles data:', profilesData.length);

                // 5. Combine
                const combined = followsData.map(f => {
                    const p = profilesData.find(profile => profile.id === f.follower_id);
                    return p ? { ...p, followed_at: f.created_at } : null;
                }).filter(Boolean);

                if (isMounted) {
                    setFollowers(combined);
                    setLoading(false);
                }

            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('❌ [Followers] Critical Error:', err);
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        fetchFollowers();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [userId]);

    return { followers, loading, error, hasMore: false, searchQuery: '', setSearchQuery: () => { }, loadMore: () => { }, updateFollowerStatus: () => { }, removeFollower: () => { }, refresh: () => { } };
};
