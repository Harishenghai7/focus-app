import { useState, useEffect } from 'react';
import { fetchStories } from '../utils/supabaseRest';

export const useStories = (followedUserIds) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStoriesData = async () => {
            // Set timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                console.warn('⚠️ Stories fetch timeout - showing empty state');
                setStories([]);
                setLoading(false);
            }, 5000); // 5 seconds (increased from 2)

            try {
                console.log('📸 Fetching Flash stories via REST API...');
                setLoading(true);

                // Fetch all stories (24 hour filter is in fetchStories)
                let storiesData = await fetchStories();

                // Clear timeout on response
                clearTimeout(timeoutId);

                // Filter by followed users if provided
                if (followedUserIds && followedUserIds.length > 0) {
                    storiesData = storiesData.filter(s =>
                        followedUserIds.includes(s.user_id)
                    );
                }

                console.log('✅ Stories fetched:', storiesData.length);

                // Group stories by user
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

                    // Check if viewed (simplified - you may need to add view tracking)
                    const isViewed = story.viewed && story.viewed.length > 0;
                    if (!isViewed) {
                        acc[userId].hasUnviewed = true;
                    }
                    return acc;
                }, {});

                setStories(Object.values(groupedStories));
            } catch (err) {
                console.error('❌ Error fetching stories:', err);
                setStories([]);
                clearTimeout(timeoutId);
            } finally {
                setLoading(false);
            }
        };

        fetchStoriesData();
    }, [followedUserIds]);

    return { stories, loading };
};
