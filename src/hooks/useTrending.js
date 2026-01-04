import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTrending = () => {
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                // Fetch trending posts (most likes in last 24h)
                // Note: In a real app, this would likely be a materialized view or RPC
                // For now, we'll fetch recent posts and sort by likes
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                const { data: posts, error: postsError } = await supabase
                    .from('posts')
                    .select('*, profiles(username, avatar_url)')
                    .gte('created_at', yesterday.toISOString())
                    .order('likes_count', { ascending: false })
                    .limit(6);

                if (postsError) throw postsError;
                setTrendingPosts(posts);

                // Fetch trending hashtags
                // Assuming a 'hashtags' table or extracting from captions
                // For simplicity, we'll use a hardcoded list or fetch from a 'trending_tags' table if it existed
                // Here we will mock it with a simple query or static data if table missing, 
                // but let's try to fetch from a hypothetical 'hashtags' table
                const { data: tags, error: tagsError } = await supabase
                    .from('hashtags')
                    .select('*')
                    .order('count', { ascending: false })
                    .limit(5);

                if (!tagsError) {
                    setTrendingHashtags(tags);
                }


            } catch (error) {
                console.error('Error fetching trending:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
    }, []);

    return { trendingPosts, trendingHashtags, loading };
};
