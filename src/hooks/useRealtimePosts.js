import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimePosts = (followedUserIds) => {
    const [newPostsCount, setNewPostsCount] = useState(0);

    useEffect(() => {
        if (!followedUserIds || followedUserIds.length === 0) return;

        const channel = supabase
            .channel('home-feed')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'posts',
                filter: `user_id=in.(${followedUserIds.join(',')})`
            }, (payload) => {
                setNewPostsCount(prev => prev + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [followedUserIds]);

    const resetCount = () => setNewPostsCount(0);

    return { newPostsCount, resetCount };
};
