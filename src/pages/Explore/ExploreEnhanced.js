// Enhanced Explore Page - Instagram Pro-Grade
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/formatNumber';
import { useAuth } from '../../hooks/useAuth';
import { normalizeHydratedProfile } from '../../utils/identityHydration';
import styles from './ExploreEnhanced.module.css';
import MainLayout from '../../components/layout/MainLayout';
import PostDetailModal from '../../components/modals/PostDetailModal';
import { Search, TrendingUp, Users, Image, Zap, Sparkles } from 'lucide-react';

const ExploreEnhanced = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: routeContentId } = useParams();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);

    // Content states
    const [posts, setPosts] = useState([]);
    const [boltz, setBoltz] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [searchResults, setSearchResults] = useState({
        posts: [],
        boltz: [],
        users: []
    });

    const [selectedPost, setSelectedPost] = useState(null);
    const [followingUsers, setFollowingUsers] = useState(new Set());
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if (!routeContentId) return;
        const merged = [...posts, ...boltz];
        if (!merged.length) return;
        const target = merged.find((item) => item.id === routeContentId);
        if (target) {
            setSelectedPost(target);
        }
    }, [routeContentId, posts, boltz]);

    // Load initial content on mount — no dep on user?.id to avoid empty state
    useEffect(() => {
        loadExploreContent();
    }, [loadExploreContent]); // runs once on mount

    // Load following status when user is available
    useEffect(() => {
        if (user?.id) {
            loadFollowingStatus();
        }
    }, [user?.id, loadFollowingStatus]);

    const loadFollowingStatus = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);
            if (data) {
                setFollowingUsers(new Set(data.map(f => f.following_id)));
            }
        } catch (error) {
            console.error('Error loading following status:', error);
        }
    }, [user?.id]);

    const loadExploreContent = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch ALL posts (no media_url filter — text posts are valid content)
            // IMPORTANT: schema uses `media_urls` (array), not `media_url` (singular) in most setups.
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('id, user_id, media_urls, caption, content, created_at, type, likes_count, comments_count, views_count, profiles:user_id(id, username, full_name, avatar_url, is_verified, trust_tier)')
                .order('created_at', { ascending: false })
                .limit(60);
            if (postsError) throw postsError;

            // Fetch boltz
            const { data: boltzData, error: boltzError } = await supabase
                .from('boltz')
                .select('id, user_id, video_url, thumbnail_url, description, created_at, likes_count, comments_count, views_count, profiles:user_id(id, username, full_name, avatar_url, is_verified, trust_tier)')
                .order('created_at', { ascending: false })
                .limit(60);
            if (boltzError) throw boltzError;

            // Fetch top users for sidebar
            const { data: topUsersData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified, followers_count, bio')
                .order('followers_count', { ascending: false, nullsFirst: false })
                .limit(20);

            const enrichedPosts = (postsData || []).map(post => ({
                ...post,
                type:    'post',
                media_url: post.media_urls?.[0] || null,
                user: normalizeHydratedProfile(post.profiles, post.user_id),
            }));

            const enrichedBoltz = (boltzData || []).map(item => ({
                ...item,
                type:      'boltz',
                media_url: item.thumbnail_url || item.video_url,
                user: normalizeHydratedProfile(item.profiles, item.user_id),
            }));

            setPosts(enrichedPosts);
            setBoltz(enrichedBoltz);
            setTopUsers(
                (topUsersData || []).map(u => ({
                    ...u,
                    avatar_url: normalizeHydratedProfile(u, u.id).avatar_url,
                }))
            );
            await loadTrendingHashtags(postsData || []);

        } catch (error) {
            console.error('Explore load error:', error);
            setPosts([]);
            setBoltz([]);
            setTopUsers([]);
            setTrendingHashtags([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadTrendingHashtags = async (recentPosts = []) => {
        try {
            const viewsToTry = ['trending_hashtags_48h_v', 'trending_hashtags_24h_v'];
            for (const viewName of viewsToTry) {
                const { data, error } = await supabase
                    .from(viewName)
                    .select('hashtag, post_count')
                    .order('post_count', { ascending: false })
                    .limit(10);
                if (!error && Array.isArray(data) && data.length > 0) {
                    setTrendingHashtags(data);
                    return;
                }
            }
        } catch (error) {
            console.warn('Trending hashtag view unavailable; using client aggregation fallback.', error);
        }

        // Fallback: derive real tags from recent post captions/content (last 48h batch).
        const bucket = new Map();
        (recentPosts || []).forEach((p) => {
            const text = `${p.caption || ''} ${p.content || ''}`;
            const tags = text.match(/#([a-zA-Z0-9_]+)/g) || [];
            tags.forEach((tag) => {
                const normalized = tag.slice(1).toLowerCase();
                bucket.set(normalized, (bucket.get(normalized) || 0) + 1);
            });
        });
        const ranked = [...bucket.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([hashtag, post_count]) => ({ hashtag, post_count }));
        setTrendingHashtags(ranked);
    };

    const handleSearch = useCallback(async (query) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setSearchResults({ posts: [], boltz: [], users: [] });
            setSearchQuery('');
            return;
        }

        setSearchQuery(trimmedQuery);
        setSearchLoading(true);

        try {
            // Search posts
            const { data: searchedPostsData, error: spError } = await supabase.from('posts')
                .select('*, profiles:user_id(id, username, full_name, avatar_url, is_verified, trust_tier)')
                .not('media_urls', 'is', null)
                .ilike('caption', `%${trimmedQuery}%`)
                .order('created_at', { ascending: false })
                .limit(20);
            if (spError) console.error('Search Posts Error:', spError);

            // Search boltz
            const { data: searchedBoltzData, error: sbError } = await supabase.from('boltz')
                .select('*, profiles:user_id(id, username, full_name, avatar_url, is_verified, trust_tier)')
                .not('video_url', 'is', null)
                .ilike('description', `%${trimmedQuery}%`)
                .order('created_at', { ascending: false })
                .limit(20);
            if (sbError) console.error('Search Boltz Error:', sbError);

            // Search users
            const { data: searchedUsersData, error: suError } = await supabase.from('profiles')
                .select('*')
                .or(`username.ilike.%${trimmedQuery}%,full_name.ilike.%${trimmedQuery}%`)
                .order('followers_count', { ascending: false, nullsFirst: false })
                .limit(20);
            if (suError) console.error('Search Users Error:', suError);

            let searchedPosts = searchedPostsData || [];
            let searchedBoltz = searchedBoltzData || [];
            let searchedUsers = searchedUsersData || [];

            const rankUsers = (usersInput) =>
                [...(usersInput || [])].sort((a, b) => {
                    const q = trimmedQuery.toLowerCase();
                    const score = (u) => {
                        const username = (u.username || '').toLowerCase();
                        const fullName = (u.full_name || '').toLowerCase();
                        let s = 0;
                        if (username === q) s += 120;
                        if (username.startsWith(q)) s += 80;
                        if (username.includes(q)) s += 45;
                        if (fullName.startsWith(q)) s += 30;
                        if (fullName.includes(q)) s += 20;
                        s += Math.min(Number(u.followers_count || 0) / 1000, 25);
                        return s;
                    };
                    return score(b) - score(a);
                });

            // Fallback if strict filtered query returns nothing.
            if (searchedUsers.length === 0) {
                const { data: fallbackUsersData } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, is_verified, followers_count')
                    .order('followers_count', { ascending: false, nullsFirst: false })
                    .limit(80);
                const q = trimmedQuery.toLowerCase();
                searchedUsers = (fallbackUsersData || []).filter((u) =>
                    (u.username || '').toLowerCase().includes(q) ||
                    (u.full_name || '').toLowerCase().includes(q)
                );
            }
            searchedUsers = rankUsers(searchedUsers);

            searchedPosts = searchedPosts.map(post => ({
                ...post,
                type: 'post',
                user: normalizeHydratedProfile(post.profiles, post.user_id)
            }));

            searchedBoltz = searchedBoltz.map(boltz => ({
                ...boltz,
                type: 'boltz',
                media_url: boltz.thumbnail_url || boltz.video_url,
                user: normalizeHydratedProfile(boltz.profiles, boltz.user_id)
            }));

            setSearchResults({
                posts: searchedPosts,
                boltz: searchedBoltz,
                users: searchedUsers
            });

        } catch (error) {
            console.error('❌ [SEARCH] Error:', error);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const handleSearchInput = (e) => {
        const value = e.target.value;

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(value);
        }, 300);
    };

    const handleFollow = async (userId) => {
        if (!user?.id) {
            navigate('/auth');
            return;
        }

        const isFollowing = followingUsers.has(userId);

        try {
            if (isFollowing) {
                await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
                setFollowingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            } else {
                await supabase.from('follows').insert([{ follower_id: user.id, following_id: userId }]);
                setFollowingUsers(prev => {
                    const newSet = new Set(prev).add(userId);
                    return newSet;
                });
            }
        } catch (error) {
            console.error('❌ [FOLLOW] Error toggling follow:', error);
        }
    };

    const handlePostClick = (item) => {
        if (item.type === 'boltz') {
            navigate(`/boltz/${item.id}`);
        } else {
            setSelectedPost(item);
        }
    };

    const getDisplayContent = () => {
        if (searchQuery) {
            const { posts: searchPosts, boltz: searchBoltz, users: searchUsers } = searchResults;
            switch (activeTab) {
                case 'users':   return { content: [],           users: searchUsers };
                case 'posts':   return { content: searchPosts,  users: [] };
                case 'boltz':   return { content: searchBoltz,  users: [] };
                default: {
                    const combined = [...searchPosts, ...searchBoltz].sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    );
                    return { content: combined, users: searchUsers };
                }
            }
        }

        switch (activeTab) {
            case 'users':    return { content: [],    users: topUsers };
            case 'posts':    return { content: posts, users: [] };
            case 'boltz':    return { content: boltz, users: [] };
            case 'trending': {
                const trending = [...posts, ...boltz]
                    .sort((a, b) => {
                        const score = (x) => (x.likes_count || 0) + (x.comments_count || 0) * 2 + (x.views_count || 0) * 0.1;
                        return score(b) - score(a);
                    })
                    .slice(0, 30);
                return { content: trending, users: [] };
            }
            default: {
                const allContent = [...posts, ...boltz].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                return { content: allContent, users: topUsers.slice(0, 6) };
            }
        }
    };

    const { content, users: displayUsers } = getDisplayContent();

    return (
        <MainLayout>
            <div className={styles.container}>
                {/* Search Bar */}
                <div className={styles.searchSection}>
                    <div className={styles.searchBar}>
                        <Search className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            placeholder="Search posts, people, or tags..."
                            className={styles.searchInput}
                            onChange={handleSearchInput}
                        />
                        {searchLoading && <div className={styles.searchSpinner} />}
                    </div>
                </div>

                {/* Category Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <Sparkles size={18} />
                        <span>All</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={18} />
                        <span>Users</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <Image size={18} />
                        <span>Posts</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'boltz' ? styles.active : ''}`}
                        onClick={() => setActiveTab('boltz')}
                    >
                        <Zap size={18} />
                        <span>Boltz</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'trending' ? styles.active : ''}`}
                        onClick={() => setActiveTab('trending')}
                    >
                        <TrendingUp size={18} />
                        <span>Trending</span>
                    </button>
                </div>

                {/* Main Content */}
                <div className={styles.mainContent}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            <p>Loading explore...</p>
                        </div>
                    ) : (
                        <>
                            {/* Users Section */}
                            {displayUsers.length > 0 && (
                                <section className={styles.usersSection}>
                                    <h2 className={styles.sectionTitle}>
                                        {searchQuery ? 'People' : activeTab === 'users' ? 'Top Users in Focus' : 'Suggested For You'}
                                    </h2>
                                    <div className={styles.usersGrid}>
                                        {displayUsers
                                            .filter(userItem => userItem.id !== user?.id)
                                            .map(userItem => (
                                                <div key={userItem.id} className={styles.userCard}>
                                                    <div
                                                        className={styles.userCardContent}
                                                        onClick={() => navigate(`/profile/${userItem.username}`)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <img
                                                            src={userItem.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userItem.username || userItem.id)}`}
                                                            alt={userItem.username || 'User'}
                                                            className={styles.userAvatar}
                                                            onError={(e) => {
                                                                e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userItem.id)}`;
                                                            }}
                                                        />
                                                        <div className={styles.userInfo}>
                                                            <div className={styles.userName}>
                                                                {userItem.username}
                                                                {(userItem.is_verified || userItem.verified) && <span className={styles.verified}>✓</span>}
                                                            </div>
                                                            {userItem.full_name && (
                                                                <div className={styles.userFullName}>{userItem.full_name}</div>
                                                            )}
                                                            {userItem.bio && (
                                                                <div className={styles.userBio}>{userItem.bio}</div>
                                                            )}
                                                            <div className={styles.userStats}>
                                                                {formatNumber(userItem.followers_count || 0)} followers
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className={`${styles.followBtn} ${followingUsers.has(userItem.id) ? styles.following : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleFollow(userItem.id);
                                                        }}
                                                    >
                                                        {followingUsers.has(userItem.id) ? 'Following' : 'Follow'}
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </section>
                            )}

                            {/* Content Grid */}
                            {!searchQuery && activeTab === 'trending' && trendingHashtags.length > 0 && (
                                <section className={styles.usersSection}>
                                    <h2 className={styles.sectionTitle}>Trending Hashtags (48h)</h2>
                                    <div className={styles.usersGrid}>
                                        {trendingHashtags.map((tag) => (
                                            <button
                                                key={tag.hashtag}
                                                className={styles.userCard}
                                                onClick={() => handleSearch(`#${tag.hashtag}`)}
                                            >
                                                <div className={styles.userCardContent}>
                                                    <div className={styles.userInfo}>
                                                        <div className={styles.userName}>#{tag.hashtag}</div>
                                                        <div className={styles.userStats}>
                                                            {formatNumber(tag.post_count || 0)} posts
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {content.length > 0 && (
                                <section className={styles.contentSection}>
                                    {!searchQuery && activeTab === 'all' && (
                                        <h2 className={styles.sectionTitle}>Discover</h2>
                                    )}
                                    <div className={styles.contentGrid}>
                                        {content.map(item => (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className={styles.contentCard}
                                                onClick={() => handlePostClick(item)}
                                            >
                                                {item.type === 'boltz' ? (
                                                    <div className={styles.videoWrapper}>
                                                        <video
                                                            src={item.video_url}
                                                            className={styles.contentMedia}
                                                            muted
                                                            playsInline
                                                        />
                                                        <div className={styles.playIcon}>▶</div>
                                                        <div className={styles.boltzBadge}>⚡</div>
                                                    </div>
                                                ) : (
                                                    item.media_url ? (
                                                        <img
                                                            src={item.media_url}
                                                            alt={item.caption || 'Post'}
                                                            className={styles.contentMedia}
                                                        />
                                                    ) : (
                                                        <div className={styles.textPostCard}>
                                                            <div className={styles.textPostBadge}>✍️</div>
                                                            <p className={styles.textPostSnippet}>
                                                                {item.caption || item.content || 'View post'}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                                <div className={styles.contentOverlay}>
                                                    <div className={styles.contentStats}>
                                                        <span>❤️ {formatNumber(item.likes_count || 0)}</span>
                                                        {item.comments_count !== undefined && (
                                                            <span>💬 {formatNumber(item.comments_count || 0)}</span>
                                                        )}
                                                        {item.views_count !== undefined && (
                                                            <span>👁️ {formatNumber(item.views_count || 0)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Empty State */}
                            {!loading && content.length === 0 && displayUsers.length === 0 && (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        {searchQuery ? '🔍' : '✨'}
                                    </div>
                                    <h3>{searchQuery ? 'No results found' : 'No content yet'}</h3>
                                    <p>{searchQuery ? 'Try searching for something else' : 'Be the first to share something!'}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Post Detail Modal */}
                {selectedPost && (
                    <PostDetailModal
                        post={selectedPost}
                        initialOpenComments={Boolean(location.state?.openComments)}
                        onClose={() => {
                            setSelectedPost(null);
                            if (routeContentId) {
                                navigate('/explore', { replace: true, state: {} });
                            }
                        }}
                        onUpdate={(postId, updates) => {
                            setPosts(prev => prev.map(p =>
                                p.id === postId ? { ...p, ...updates } : p
                            ));
                        }}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default ExploreEnhanced;
