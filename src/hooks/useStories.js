import { useState, useEffect } from 'react';
import { fetchStories } from '../utils/supabaseRest';
import { supabase } from '../lib/supabase';

export const useStories = (followedUserIds) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let timeoutId;
        let channel;
        let cancelled = false;

        const fetchStoriesData = async () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.warn('⚠️ Stories fetch timeout - showing empty state');
                if (!cancelled) {
                    setStories([]);
                    setLoading(false);
                }
            }, 5000);

            try {

                if (!cancelled) setLoading(true);

                let storiesData = await fetchStories();

                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = undefined;
                }

                if (followedUserIds && followedUserIds.length > 0) {
                    storiesData = storiesData.filter((s) =>
                        followedUserIds.includes(s.user_id)
                    );
                }



                const groupedStories = storiesData.reduce((acc, story) => {
                    const userId = story.user_id;
                    if (!acc[userId]) {
                        acc[userId] = {
                            user: story.user,
                            stories: [],
                            hasUnviewed: false,
                        };
                    }
                    acc[userId].stories.push(story);
                    const isViewed = Boolean(
                        story.is_viewed ||
                        story.viewed_by_current_user ||
                        story.viewed_at ||
                        (story.viewed && story.viewed.length > 0)
                    );
                    if (!isViewed) {
                        acc[userId].hasUnviewed = true;
                    }
                    return acc;
                }, {});

                if (!cancelled) setStories(Object.values(groupedStories));
            } catch (err) {
                console.error('❌ Error fetching stories:', err);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = undefined;
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchStoriesData();

        channel = supabase
            .channel('public:flash_realtime')
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'flash' },
                (payload) => {
                    const deletedId = payload.old?.id;
                    if (!deletedId) return;

                    setStories((prev) =>
                        prev
                            .map((group) => ({
                                ...group,
                                stories: group.stories.filter((s) => s.id !== deletedId),
                            }))
                            .filter((group) => group.stories.length > 0)
                    );
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'flash' },
                () => {
                    fetchStoriesData();
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'flash' },
                () => {
                    fetchStoriesData();
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (channel) supabase.removeChannel(channel);
        };
    }, [followedUserIds]);

    return { stories, loading };
};
