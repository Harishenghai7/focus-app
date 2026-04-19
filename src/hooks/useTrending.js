import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useTrending — Focus Platform
 * Fetches real trending hashtags (via RPC view) + trending posts (24h).
 * No fake data. Falls back gracefully if the view doesn't exist yet.
 */
export const useTrending = () => {
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrending = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            // ── Trending Posts: top-engaged in last 24h ──────────────────
            const { data: posts, error: postsErr } = await supabase
                .from('posts')
                .select('*, profiles(id, username, avatar_url, is_verified)')
                .gte('created_at', yesterday)
                .order('likes_count', { ascending: false })
                .limit(6);

            if (postsErr) throw postsErr;
            setTrendingPosts(posts || []);

            // ── Trending Hashtags: try RPC first, fall back to view ──────
            const { data: rpcTags, error: rpcErr } = await supabase
                .rpc('get_trending_hashtags', { limit_count: 10 });

            if (!rpcErr && rpcTags?.length) {
                setTrendingHashtags(rpcTags);
                return;
            }

            // Fallback: query the view directly
            const { data: viewTags, error: viewErr } = await supabase
                .from('trending_hashtags')
                .select('tag, post_count, score, last_used')
                .order('score', { ascending: false })
                .limit(10);

            if (!viewErr && viewTags?.length) {
                setTrendingHashtags(viewTags);
                return;
            }

            // Last resort: extract hashtags client-side from recent posts
            if (posts?.length) {
                const tagMap = {};
                posts.forEach(p => {
                    const text = (p.content || '') + ' ' + (p.caption || '');
                    const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
                    matches.forEach(tag => {
                        const t = tag.slice(1).toLowerCase();
                        tagMap[t] = (tagMap[t] || 0) + 1;
                    });
                });
                const extracted = Object.entries(tagMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([tag, post_count]) => ({ tag, post_count, score: post_count }));
                setTrendingHashtags(extracted);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrending();
    }, [fetchTrending]);

    return { trendingPosts, trendingHashtags, loading, error, refetch: fetchTrending };
};
