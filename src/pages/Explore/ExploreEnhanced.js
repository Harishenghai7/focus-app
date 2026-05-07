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

    // Define functions BEFORE the useEffects that use them
    // IMPORTANT: loadTrendingHashtags must be defined BEFORE loadExploreContent

    const loadTrendingHashtags = useCallback(async (recentPosts = []) => {
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
            console.warn('[Explore] Trending view unavailable, using fallback.', error);
        }

        // Fallback: derive real tags from recent post captions/content
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
    }, []);

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
            console.error('[Explore] Following status error:', error);
        }
    }, [user?.id]);

    const loadExploreContent = useCallback(async () => {
        setLoading(true);

        
        let postsData = [];
        let boltzData = [];
        let topUsersData = [];
        
        try {
            // Fetch posts using unified RPC

            const { data: postsRpcData, error: postsError } = await supabase.rpc('get_public_feed', {
                p_limit: 60,
                p_offset: 0
            });
            
            if (postsError) {
                console.error('[Explore] Posts RPC error:', postsError);
                // Fallback: simple query
                const { data: simplePosts } = await supabase
                    .from('posts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(60);
                postsData = simplePosts || [];
            } else {
                postsData = postsRpcData || [];
            }


            // Fetch boltz using unified RPC

            const { data: boltzRpcData, error: boltzError } = await supabase.rpc('get_public_boltz_feed', {
                p_limit: 60,
                p_offset: 0
            });
            
            if (boltzError) {
                console.error('[Explore] Boltz RPC error:', boltzError);
                // Fallback: simple query
                const { data: simpleBoltz } = await supabase
                    .from('boltz')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(60);
                boltzData = simpleBoltz || [];
            } else {
                boltzData = boltzRpcData || [];
            }


            // Fetch top users

            const usersResult = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified, followers_count, bio')
                .order('followers_count', { ascending: false, nullsFirst: false })
                .limit(20);
            
            if (usersResult.error) {
                console.error('[Explore] Users error:', usersResult.error);
            } else {
                topUsersData = usersResult.data || [];

            }

            // Create a lookup map for user profiles
            const usersMap = new Map();
            topUsersData.forEach(u => usersMap.set(u.id, u));

            // Enrich posts - RPC returns user data directly (username, avatar_url, etc.)
            const enrichedPosts = (postsData || []).map(post => {
                // Build user object from RPC response fields
                const userFromRpc = post.username ? {
                    id: post.user_id,
                    username: post.username,
                    full_name: post.full_name,
                    avatar_url: post.avatar_url,
                    is_verified: post.is_verified,
                    trust_tier: post.trust_tier
                } : null;
                const user = userFromRpc || usersMap.get(post.user_id) || null;
                return {
                    ...post,
                    type: 'post',
                    media_url: post.media_urls?.[0] || post.media_url || null,
                    user: normalizeHydratedProfile(user, post.user_id),
                };
            });

            // Enrich boltz - RPC returns user data directly
            const enrichedBoltz = (boltzData || []).map(item => {
                const userFromRpc = item.username ? {
                    id: item.user_id,
                    username: item.username,
                    full_name: item.full_name,
                    avatar_url: item.avatar_url,
                    is_verified: item.is_verified
                } : null;
                const user = userFromRpc || usersMap.get(item.user_id) || null;
                return {
                    ...item,
                    type: 'boltz',
                    media_url: item.thumbnail_url || item.video_url,
                    video_url: item.video_url,
                    thumbnail_url: item.thumbnail_url,
                    user: normalizeHydratedProfile(user, item.user_id),
                };
            });

            // Enrich users
            const enrichedUsers = (topUsersData || []).map(u => ({
                ...u,
                avatar_url: normalizeHydratedProfile(u, u.id).avatar_url,
            }));



            // Set state
            setPosts(enrichedPosts);
            setBoltz(enrichedBoltz);
            setTopUsers(enrichedUsers);
            
            // Load trending hashtags
            if (postsData && postsData.length > 0) {
                await loadTrendingHashtags(postsData);
            }



        } catch (error) {
            console.error('[Explore] CRITICAL ERROR:', error);
            setPosts([]);
            setBoltz([]);
            setTopUsers([]);
            setTrendingHashtags([]);
        } finally {
            setLoading(false);
        }
    }, []); // Empty deps - loadTrendingHashtags is stable from useCallback above

    // ═══════════════════════════════════════════════════════════════════════════════
    // USEEFFECTS (must come AFTER function definitions)
    // ═══════════════════════════════════════════════════════════════════════════════

    // Handle route content ID
    useEffect(() => {
        if (!routeContentId) return;
        const merged = [...posts, ...boltz];
        if (!merged.length) return;
        const target = merged.find((item) => item.id === routeContentId);
        if (target) {
            setSelectedPost(target);
        }
    }, [routeContentId, posts, boltz]);

    // Load initial content on mount - runs once only
    useEffect(() => {

        loadExploreContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array = run once on mount

    // Load following status when user is available
    useEffect(() => {
        if (user?.id) {
            loadFollowingStatus();
        }
    }, [user?.id, loadFollowingStatus]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════════

    const handleSearch = useCallback(async (query) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setSearchResults({ posts: [], boltz: [], users: [] });
            setSearchQuery('');
            return;
        }

        setSearchQuery(trimmedQuery);
        setSearchLoading(true);
        
        const q = trimmedQuery.toLowerCase();



        try {
            // Always fetch users from top list for client-side filtering
            // This ensures we can match partial strings reliably

            const { data: allUsersData, error: allUsersError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified, followers_count, bio')
                .order('followers_count', { ascending: false, nullsFirst: false })
                .limit(200);
            
            if (allUsersError) {
                console.error('[Explore] All users fetch error:', allUsersError);
            }


            // Client-side filter users - more reliable than Supabase ILIKE for partial matches
            let searchedUsers = (allUsersData || []).filter((u) => {
                const usernameMatch = (u.username || '').toLowerCase().includes(q);
                const fullNameMatch = (u.full_name || '').toLowerCase().includes(q);
                const bioMatch = (u.bio || '').toLowerCase().includes(q);
                return usernameMatch || fullNameMatch || bioMatch;
            });


            // Rank users by relevance
            const rankUsers = (usersInput) =>
                [...(usersInput || [])].sort((a, b) => {
                    const score = (u) => {
                        const username = (u.username || '').toLowerCase();
                        const fullName = (u.full_name || '').toLowerCase();
                        let s = 0;
                        // Exact match gets highest score
                        if (username === q) s += 200;
                        if (fullName === q) s += 150;
                        // Starts with query
                        if (username.startsWith(q)) s += 100;
                        if (fullName.startsWith(q)) s += 80;
                        // Contains query
                        if (username.includes(q)) s += 50;
                        if (fullName.includes(q)) s += 40;
                        if ((u.bio || '').toLowerCase().includes(q)) s += 20;
                        // Followers boost
                        s += Math.min(Number(u.followers_count || 0) / 500, 30);
                        return s;
                    };
                    return score(b) - score(a);
                });

            searchedUsers = rankUsers(searchedUsers);

            // Search posts from Supabase

            const { data: searchedPostsData, error: spError } = await supabase
                .from('posts')
                .select(`
                    *, 
                    profiles:user_id(id, username, full_name, avatar_url, is_verified, trust_tier)
                `)
                .or(`caption.ilike.%${trimmedQuery}%,content.ilike.%${trimmedQuery}%`)
                .order('created_at', { ascending: false })
                .limit(30);
            
            if (spError) {
                console.error('[Explore] Search posts error:', spError);
            } else {

            }

            // Search boltz from Supabase

            const { data: searchedBoltzData, error: sbError } = await supabase
                .from('boltz')
                .select(`
                    *, 
                    profiles:user_id(id, username, full_name, avatar_url, is_verified, trust_tier)
                `)
                .ilike('description', `%${trimmedQuery}%`)
                .order('created_at', { ascending: false })
                .limit(30);
            
            if (sbError) {
                console.error('[Explore] Search boltz error:', sbError);
            } else {

            }

            // Enrich posts and boltz with user data (handle both RPC and FK join formats)
            const enrichedPosts = (searchedPostsData || []).map(post => {
                const userFromRpc = post.username ? {
                    id: post.user_id,
                    username: post.username,
                    full_name: post.full_name,
                    avatar_url: post.avatar_url,
                    is_verified: post.is_verified,
                    trust_tier: post.trust_tier
                } : null;
                return {
                    ...post,
                    type: 'post',
                    media_url: post.media_urls?.[0] || post.media_url || null,
                    user: normalizeHydratedProfile(userFromRpc || post.profiles, post.user_id)
                };
            });

            const enrichedBoltz = (searchedBoltzData || []).map((item, idx) => {
                const userFromRpc = item.username ? {
                    id: item.user_id,
                    username: item.username,
                    full_name: item.full_name,
                    avatar_url: item.avatar_url,
                    is_verified: item.is_verified
                } : null;
                return {
                    ...item,
                    type: 'boltz',
                    media_url: item.thumbnail_url || item.video_url,
                    video_url: item.video_url,
                    thumbnail_url: item.thumbnail_url || item.poster_url || item.preview_image || item.cover_url || null,
                    user: normalizeHydratedProfile(userFromRpc || item.profiles, item.user_id)
                };
            });



            setSearchResults({
                posts: enrichedPosts,
                boltz: enrichedBoltz,
                users: searchedUsers
            });



        } catch (error) {
            console.error('[Explore] Search error:', error);
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

                {/* Category Tabs with Refresh */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <Sparkles size={18} />
                        <span>All ({posts.length + boltz.length})</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={18} />
                        <span>Users ({topUsers.length})</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <Image size={18} />
                        <span>Posts ({posts.length})</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'boltz' ? styles.active : ''}`}
                        onClick={() => setActiveTab('boltz')}
                    >
                        <Zap size={18} />
                        <span>Boltz ({boltz.length})</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'trending' ? styles.active : ''}`}
                        onClick={() => setActiveTab('trending')}
                    >
                        <TrendingUp size={18} />
                        <span>Trending</span>
                    </button>
                    <button
                        className={styles.tab}
                        onClick={() => {

                            loadExploreContent();
                        }}
                        style={{ marginLeft: 'auto', background: 'rgba(139, 92, 246, 0.2)' }}
                    >
                        <span>🔄 Refresh</span>
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
                                    {!searchQuery && activeTab === 'posts' && (
                                        <h2 className={styles.sectionTitle}>Latest Posts</h2>
                                    )}
                                    {!searchQuery && activeTab === 'boltz' && (
                                        <h2 className={styles.sectionTitle}>Boltz Videos</h2>
                                    )}
                                    {!searchQuery && activeTab === 'trending' && (
                                        <h2 className={styles.sectionTitle}>Trending Now</h2>
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
                                                            poster={item.thumbnail_url}
                                                            className={styles.contentMedia}
                                                            muted
                                                            playsInline
                                                            preload="metadata"
                                                            crossOrigin="anonymous"
                                                            onLoadedMetadata={(e) => {
                                                                try {
                                                                    const v = e.currentTarget;
                                                                    v.currentTime = 0.001;
                                                                    v.pause();
                                                                } catch {}
                                                            }}
                                                            onError={(e) => {
                                                                console.error('[Explore] Video failed to load:', item.video_url);
                                                            }}
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
                                                            onError={(e) => {
                                                                console.error('[Explore] Image failed to load:', item.media_url);
                                                                e.target.style.display = 'none';
                                                            }}
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
                                    <h3>
                                        {searchQuery ? 'No results found' : 
                                         activeTab === 'posts' ? 'No posts yet' :
                                         activeTab === 'boltz' ? 'No boltz videos yet' :
                                         activeTab === 'trending' ? 'No trending content yet' :
                                         'No content yet'}
                                    </h3>
                                    <p>
                                        {searchQuery ? 'Try searching for something else' : 
                                         activeTab === 'posts' ? 'Create a post to see it here!' :
                                         activeTab === 'boltz' ? 'Upload a boltz video to see it here!' :
                                         activeTab === 'trending' ? 'Content will appear here once there\'s more activity' :
                                         'Be the first to share something!'}
                                    </p>
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
