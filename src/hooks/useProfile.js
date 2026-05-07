import { useState, useCallback, useRef } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useProfile = (username) => {
    const { user: currentUser, profile: authProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [currentUserRelation, setCurrentUserRelation] = useState({
        isFollowing: false,
        isBlocked: false,
        isMuted: false
    });

    const isMounted = useRef(true);
    const usernameRef = useRef(username);

    // 1. Fetch Profile Logic
    const fetchProfileData = useCallback(async () => {
        if (!username) throw new Error('No username provided');

        const isOwnProfile =
            Boolean(currentUser) &&
            (username === currentUser.id ||
                (authProfile?.username && username === authProfile.username));

        // A. Own Profile
        if (isOwnProfile && authProfile) {
            // Fetch real counts
            const [followers, following, posts] = await Promise.all([
                supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', currentUser.id),
                supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', currentUser.id),
                supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id)
            ]);

            return {
                ...authProfile,
                posts_count: posts.count || 0,
                followers_count: followers.count || 0,
                following_count: following.count || 0
            };
        }

        // B. Other Profile
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);
        
        let query = supabase.from('profiles').select('*');
        if (isUuid) {
            query = query.eq('id', username);
        } else {
            query = query.eq('username', username);
        }

        const { data: rows, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        const data = rows?.[0];
        if (!data) throw new Error('Profile not found');

        // Fetch counts & relation
        const promises = [
            supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', data.id),
            supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', data.id),
            supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', data.id)
        ];

        if (currentUser) {
            promises.push(
                supabase.from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', data.id).single()
            );
        }

        const results = await Promise.all(promises);
        const [followers, following, posts] = results;
        const followStatus = currentUser ? results[3] : { data: null };

        return {
            profile: {
                ...data,
                posts_count: posts.count || 0,
                followers_count: followers.count || 0,
                following_count: following.count || 0
            },
            relation: {
                isFollowing: !!followStatus.data,
                isBlocked: false, // TODO
                isMuted: false // TODO
            }
        };
    }, [username, currentUser, authProfile]);

    const {
        data: fetchedData,
        loading,
        error,
        refetch
    } = useRobustQuery(fetchProfileData, {
        enabled: !!username,
        retries: 3,
        onSuccess: (result) => {
            if (result.profile) {
                setProfile(result.profile);
                setCurrentUserRelation(result.relation);
            } else {
                // Own profile case
                setProfile(result);
            }
        }
    });

    // 2. Realtime Subscription for Follows
    useRealtimeSubscription({
        channelName: `profile-follows-${username}`,
        table: 'follows',
        event: '*',
        enabled: !!profile,
        onEvent: (payload) => {
            // Check if relevant to this profile
            if (payload.new.following_id === profile?.id || payload.old?.following_id === profile?.id) {

                refetch();
            }
        }
    });

    const updateFollowStatus = useCallback((isFollowing) => {
        setCurrentUserRelation(prev => ({ ...prev, isFollowing }));
        refetch();
    }, [refetch]);

    return {
        profile,
        loading,
        error,
        currentUserRelation,
        updateFollowStatus,
        refresh: refetch
    };
};
