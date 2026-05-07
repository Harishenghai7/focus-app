/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏛️ EXPLORE — THE SOVEREIGN DISCOVERY ARCHITECTURE
 * H2 Universal Theme | Trust Shield Integration | Launch-Ready Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * THE DISCOVERY LOGIC (Tiered Algorithm):
 * 1. TRUST SHIELD PRIORITY: Verified users get 1.2x visibility boost
 * 2. CONTENT PURITY: Filtered via is_flagged boolean (Pillar 2)
 * 3. CATEGORICAL RESONANCE: Interest-based grouping
 * 4. TRENDING VELOCITY: 24h engagement window for hashtags
 *
 * Features:
 * - Masonry Grid with Royal Lavender glassmorphism
 * - Verified Only toggle for Trust Shield holders
 * - Debounced search (300ms) with real-time suggestions
 * - Pagination: 20 items per fetch for performance
 * - Focusly AI empty states with personality
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, Users, Image, Zap } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { getAuthToken } from '../../utils/supabaseRest';
import { formatNumber } from '../../utils/formatNumber';
import { useFocusUser } from '../../context/FocusUserContext';
import styles from './Explore.module.css';
import MainLayout from '../../components/layout/MainLayout';
import EnhancedSearchBar from '../../components/explore/EnhancedSearchBar';
import PostDetailModal from '../../components/modals/PostDetailModal';
import UserAvatar from '../../components/ui/Avatar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { fetchBoltzPreview } from '../../services/boltzService';

const looksLikeImage = (url) => /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url || '');

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════════ */
const TABS = [
    { id: 'posts',    label: 'Posts',    icon: Image },
    { id: 'boltz',    label: 'Boltz',    icon: Zap },
    { id: 'users',    label: 'Users',    icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
];

const ITEMS_PER_PAGE = 20;
const DEBOUNCE_MS = 300;

// Trust Shield Boost Factor (verified content gets priority)
const TRUST_SHIELD_BOOST = 1.2;

// Focusly AI Empty State Messages
const EMPTY_MESSAGES = {
    posts: ["No posts found yet", "Be the first to share something amazing! ✨"],
    boltz: ["No Boltz videos yet", "Create short-form content that pops! ⚡"],
    users: ["No users found", "Invite your friends to join the nation! �"],
    trending: ["Trending hashtags loading...", "Discover what's buzzing! 🔥"],
    search: ["Macha, even I couldn't find that!", "Maybe they haven't joined our nation yet? 🔍"],
};

/* ═══════════════════════════════════════════════════════════════════════════════
   API HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
const apiFetch = async (path) => {
    try {
        const token = await getAuthToken();
        const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            console.warn(`API Error ${res.status}: ${path}`);
            return [];
        }
        return res.json();
    } catch (err) {
        console.error('API Fetch Error:', err);
        return [];
    }
};

/* ═══════════════════════════════════════════════════════════════════════════════
   GRID COMPONENTS — H2 Royal Lavender Masonry
   ═══════════════════════════════════════════════════════════════════════════════ */

// Calculate discovery score for Trust Shield prioritization
const calculateDiscoveryScore = (item) => {
    let score = 0;
    
    // Base engagement score
    score += (item.likes_count || 0) * 1;
    score += (item.comments_count || 0) * 2;
    score += (item.shares_count || 0) * 3;
    score += (item.views_count || 0) * 0.1;
    
    // Trust Shield boost (1.2x for verified users)
    if (item.user?.is_verified || item.user?.trust_tier >= 4) {
        score *= TRUST_SHIELD_BOOST;
    }
    
    // Recency boost (posts from last 24h get slight boost)
    const hoursSinceCreated = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated < 24) {
        score *= 1.1;
    }
    
    return score;
};

// Enhanced Masonry Grid with Trust Shield badges and hover effects
const MasonryGrid = ({ items, onItemClick, verifiedOnly = false }) => {
    const [erroredBoltzThumbs, setErroredBoltzThumbs] = useState({});
    // Sort by discovery score for smart discovery
    const sortedItems = useMemo(() => {
        return [...items]
            .map(item => ({ ...item, _score: calculateDiscoveryScore(item) }))
            .sort((a, b) => b._score - a._score);
    }, [items]);

    const filteredItems = verifiedOnly 
        ? sortedItems.filter(item => item.user?.is_verified || item.user?.trust_tier >= 4)
        : sortedItems;

    return (
        <div className={styles.masonryGrid}>
            <AnimatePresence>
                {filteredItems.map((item, index) => (
                    <motion.div
                        key={`${item.type}-${item.id}`}
                        className={styles.masonryItem}
                        onClick={() => onItemClick(item)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        {item.type === 'boltz' ? (
                            <div className={styles.boltzThumb}>
                                {/* Video first-frame is most reliable for Boltz */}
                                {item.video_url ? (
                                    <video
                                        src={item.video_url}
                                        className={styles.thumbMedia}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        crossOrigin="anonymous"
                                        poster={item.thumbnail_url || ''}
                                        onLoadedMetadata={(e) => {
                                            try {
                                                const v = e.currentTarget;
                                                v.currentTime = 0.001;
                                                v.pause();
                                                // Force repaint
                                                v.style.opacity = '0.99';
                                                setTimeout(() => v.style.opacity = '1', 50);
                                            } catch {}
                                        }}
                                        onError={(e) => {
                                            // Video failed, trigger image fallback

                                            setErroredBoltzThumbs(prev => ({ ...prev, [item.id]: true }));
                                        }}
                                    />
                                ) : (!erroredBoltzThumbs[item.id] && (item.thumbnail_url || item.media_url || item.poster_url || item.cover_url)) ? (
                                    <img
                                        src={item.thumbnail_url || item.media_url || item.poster_url || item.cover_url}
                                        alt={item.caption || 'Boltz'}
                                        className={styles.thumbMedia}
                                        loading="lazy"
                                        onError={() => setErroredBoltzThumbs(prev => ({ ...prev, [item.id]: true }))}
                                    />
                                ) : (
                                    <div className={styles.thumbPlaceholder}>⚡</div>
                                )}
                                <div className={styles.boltzBadge}>⚡ Boltz</div>
                                <div className={styles.playOverlay}>▶</div>
                            </div>
                        ) : (
                            <img
                                src={item.media_url}
                                alt={item.caption || 'Post'}
                                className={styles.thumbMedia}
                                loading="lazy"
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        )}
                        
                        {/* Glassmorphism Overlay with Trust Shield */}
                        <div className={styles.thumbOverlay}>
                            <div className={styles.overlayContent}>
                                <UserAvatar
                                    src={item.user?.avatar_url}
                                    username={item.user?.username}
                                    fullName={item.user?.full_name}
                                    size="sm"
                                    isVerified={item.user?.is_verified}
                                    className={styles.overlayAvatar}
                                />
                                <div className={styles.overlayMeta}>
                                    <span className={styles.thumbUser}>@{item.user?.username}</span>
                                    {item.user?.is_verified && (
                                        <Shield size={12} className={styles.trustShieldIcon} />
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Engagement Stats */}
                        <div className={styles.engagementOverlay}>
                            <span>❤️ {formatNumber(item.likes_count || 0)}</span>
                            <span>💬 {formatNumber(item.comments_count || 0)}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

/* ── Enhanced Boltz Grid with Trust Shield ────────────────────── */
const BoltzGrid = ({ items, onItemClick, verifiedOnly = false }) => {
    const [erroredBoltzThumbs, setErroredBoltzThumbs] = useState({});
    const sortedItems = useMemo(() => {
        return [...items]
            .map(item => ({ ...item, _score: calculateDiscoveryScore(item) }))
            .sort((a, b) => b._score - a._score);
    }, [items]);

    const filteredItems = verifiedOnly
        ? sortedItems.filter(item => item.user?.is_verified || item.user?.trust_tier >= 4)
        : sortedItems;

    return (
        <div className={styles.boltzGrid}>
            <AnimatePresence>
                {filteredItems.map((item, index) => (
                    <motion.div
                        key={item.id}
                        className={styles.boltzGridItem}
                        onClick={() => onItemClick(item)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                    >
                        {/* Video first-frame is most reliable for Boltz previews */}
                        {item.video_url ? (
                            <video
                                src={item.video_url}
                                className={styles.boltzGridThumb}
                                muted
                                playsInline
                                preload="metadata"
                                onLoadedMetadata={(e) => {
                                    try {
                                        e.currentTarget.currentTime = 0.001;
                                    } catch {}
                                }}
                            />
                        ) : (!erroredBoltzThumbs[item.id] && (item.thumbnail_url || item.media_url || item.poster_url || item.cover_url)) ? (
                            <img
                                src={item.thumbnail_url || item.media_url || item.poster_url || item.cover_url}
                                alt={item.description || 'Boltz'}
                                className={styles.boltzGridThumb}
                                onError={() => setErroredBoltzThumbs(prev => ({ ...prev, [item.id]: true }))}
                            />
                        ) : (
                            <div className={styles.boltzGridThumb} style={{display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-tertiary,#2d1f42)'}}>
                                <span style={{fontSize:'32px'}}>⚡</span>
                            </div>
                        )}
                        {/* Video element - positioned absolute over thumbnail, plays on hover */}
                        {item.video_url && (
                            <video
                                src={item.video_url}
                                className={styles.boltzGridVideo}
                                muted
                                playsInline
                                preload="none"
                                loop
                                onMouseEnter={e => { e.target.style.opacity = '1'; e.target.play(); }}
                                onMouseLeave={e => { e.target.style.opacity = '0'; e.target.pause(); e.target.currentTime = 0; }}
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                            />
                        )}
                        <div className={styles.boltzGridOverlay}>
                            <span>▶</span>
                            <span className={styles.boltzGridUser}>@{item.user?.username || 'user'}</span>
                            {item.user?.is_verified && (
                                <Shield size={14} className={styles.boltzTrustShield} />
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

/* ── Enhanced Users List with Trust Shield ───────────────────── */
const UsersList = ({ users, onUserClick, verifiedOnly = false }) => {
    // Sort by followers and Trust Shield status
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            const aVerified = a.is_verified || (a.trust_tier || 0) >= 4;
            const bVerified = b.is_verified || (b.trust_tier || 0) >= 4;
            if (aVerified && !bVerified) return -1;
            if (!aVerified && bVerified) return 1;
            return (b.followers_count || 0) - (a.followers_count || 0);
        });
    }, [users]);

    const filteredUsers = verifiedOnly
        ? sortedUsers.filter(u => u.is_verified || (u.trust_tier || 0) >= 4)
        : sortedUsers;

    return (
        <div className={styles.usersList}>
            <AnimatePresence>
                {filteredUsers.map((user, index) => (
                    <motion.div
                        key={user.id}
                        className={styles.userRow}
                        onClick={() => onUserClick(user)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(52,32,80,0.85)' }}
                    >
                        <UserAvatar
                            src={user.avatar_url}
                            username={user.username}
                            fullName={user.full_name}
                            size="md"
                            isVerified={user.is_verified}
                        />
                        <div className={styles.userMeta}>
                            <span className={styles.userDisplayName}>
                                {user.full_name || user.username}
                                {user.is_verified && <Shield size={14} className={styles.verifiedBadgeIcon} />}
                            </span>
                            <span className={styles.userHandle}>@{user.username}</span>
                            <span className={styles.userFollowers}>
                                {formatNumber(user.followers_count || 0)} followers
                                {user.trust_tier >= 4 && (
                                    <span className={styles.trustTierBadge}>Trust Shield Tier {user.trust_tier}</span>
                                )}
                            </span>
                        </div>
                        <button className={styles.followBtn}>Follow</button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

/* ── Enhanced Trending Section with 24h Algorithm ────────────── */
const TrendingSection = ({ posts, searchQuery }) => {
    // 24-hour trending algorithm with velocity scoring
    const trendingData = useMemo(() => {
        const tagStats = {};
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        posts.forEach(post => {
            const postTime = new Date(post.created_at).getTime();
            const isRecent = postTime > twentyFourHoursAgo;
            
            const tags = (post.caption || '').match(/#\w+/g) || [];
            tags.forEach(tag => {
                const lowerTag = tag.toLowerCase();
                if (!tagStats[lowerTag]) {
                    tagStats[lowerTag] = { 
                        count: 0, 
                        recentCount: 0, 
                        engagement: 0,
                        posts: [] 
                    };
                }
                tagStats[lowerTag].count++;
                tagStats[lowerTag].posts.push(post);
                
                if (isRecent) {
                    tagStats[lowerTag].recentCount++;
                }
                
                // Engagement score
                tagStats[lowerTag].engagement += 
                    (post.likes_count || 0) + 
                    (post.comments_count || 0) * 2 + 
                    (post.shares_count || 0) * 3;
            });
        });

        // Calculate trending score with recency boost
        return Object.entries(tagStats)
            .map(([tag, stats]) => ({
                tag,
                displayTag: tag,
                count: stats.count,
                recentCount: stats.recentCount,
                engagement: stats.engagement,
                // Trending score: recent posts get 2x weight + engagement
                score: (stats.recentCount * 2) + (stats.engagement * 0.1),
                topPost: stats.posts[0],
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);
    }, [posts]);

    return (
        <div className={styles.trendingSection}>
            <div className={styles.trendingHeader}>
                <h3 className={styles.trendingTitle}>
                    <TrendingUp size={18} />
                    Trending Now
                </h3>
                <span className={styles.trendingSubtitle}>Last 24 hours</span>
            </div>
            
            <div className={styles.hashtagGrid}>
                <AnimatePresence>
                    {trendingData.map((item, index) => (
                        <motion.div
                            key={item.tag}
                            className={styles.hashtagChip}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.02, borderColor: 'rgba(126,87,194,0.6)' }}
                        >
                            <div className={styles.hashtagRank}>#{index + 1}</div>
                            <div className={styles.hashtagInfo}>
                                <span className={styles.hashtagName}>{item.displayTag}</span>
                                <span className={styles.hashtagMeta}>
                                    {formatNumber(item.recentCount)} new • {formatNumber(item.count)} total
                                </span>
                            </div>
                            <div className={styles.hashtagEngagement}>
                                🔥 {Math.round(item.score)}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {trendingData.length === 0 && (
                    <motion.div 
                        className={styles.emptyState}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span className={styles.emptyIcon}>🔍</span>
                        <p>{searchQuery ? EMPTY_MESSAGES.search[0] : EMPTY_MESSAGES.trending[0]}</p>
                        <p className={styles.emptySubtext}>
                            {searchQuery ? EMPTY_MESSAGES.search[1] : EMPTY_MESSAGES.trending[1]}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN EXPLORE PAGE — Sovereign Discovery Interface
   ═══════════════════════════════════════════════════════════════════════════════ */
const Explore = () => {
    const navigate = useNavigate();
    const { user } = useFocusUser();
    
    // ── State Management ─────────────────────────────────────
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [boltzItems, setBoltzItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPost, setSelectedPost] = useState(null);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const searchTimeout = useRef(null);

    /* ── Content Loading with Filtering ───────────────────── */
    const loadContent = useCallback(async (query = '', pageNum = 0) => {
        setLoading(true);
        try {
            const q = query.trim().toLowerCase();
            const from = pageNum * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;
            
            // Build queries with content filtering (exclude flagged content)
            const postsQuery = q
                ? `/posts?select=id,user_id,media_url,caption,created_at,type,likes_count,comments_count,shares_count,views_count&caption=ilike.*${q}*&is_flagged=eq.false&order=created_at.desc&limit=${ITEMS_PER_PAGE}&offset=${from}`
                : `/posts?select=id,user_id,media_url,caption,created_at,type,likes_count,comments_count,shares_count,views_count&is_flagged=eq.false&order=created_at.desc&limit=${ITEMS_PER_PAGE}&offset=${from}`;
                
            const boltzQuery = null;
                
            const usersQuery = `/profiles?select=id,username,full_name,avatar_url,is_verified,trust_tier,followers_count${q ? `&or=(username.ilike.*${q}*,full_name.ilike.*${q}*)` : ''}&order=followers_count.desc.nullslast&limit=20`;

            const [postsData, usersData, boltzData] = await Promise.all([
                apiFetch(postsQuery),
                apiFetch(usersQuery),
                fetchBoltzPreview(ITEMS_PER_PAGE, from),
            ]);

            /* Fetch profiles for post/boltz authors in one batch */
            const userIds = [
                ...new Set([
                    ...postsData.map(p => p.user_id).filter(Boolean),
                    ...boltzData.map(b => b.user_id).filter(Boolean),
                ])
            ];
            
            const profilesMap = {};
            if (userIds.length > 0) {
                const profiles = await apiFetch(
                    `/profiles?select=id,username,full_name,avatar_url,is_verified,trust_tier&id=in.(${userIds.join(',')})`
                );
                profiles.forEach(p => { profilesMap[p.id] = p; });
            }

            const enrichedPosts = postsData.map(p => ({
                ...p,
                type: p.type || 'post',
                user: profilesMap[p.user_id] || null,
            }));

            const enrichedBoltz = boltzData.map(b => {
                const videoUrl = b._videoFallback || b.video_url || null;
                const thumbUrl = b._previewThumb || b.thumbnail_url || b.poster_url || b.cover_url || null;
                // DEBUG: Log first few items to verify URLs
                if (boltzData.indexOf(b) < 3) {
                }
                return {
                    ...b,
                    type: 'boltz',
                    media_url: thumbUrl || videoUrl,
                    thumbnail_url: thumbUrl,
                    video_url: videoUrl,
                    user: profilesMap[b.user_id] || b.profiles || null,
                };
            });

            if (pageNum === 0) {
                setPosts(enrichedPosts);
                setBoltzItems(enrichedBoltz);
                setUsers(usersData);
            } else {
                setPosts(prev => [...prev, ...enrichedPosts]);
                setBoltzItems(prev => [...prev, ...enrichedBoltz]);
            }
            
            setHasMore(postsData.length === ITEMS_PER_PAGE || boltzData.length === ITEMS_PER_PAGE);
        } catch (err) {
            console.warn('Explore load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => { 
        loadContent(); 
    }, [loadContent]);

    /* ── Debounced Search ──────────────────────────────────── */
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setPage(0);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => loadContent(query, 0), DEBOUNCE_MS);
    }, [loadContent]);

    /* ── Load More (Pagination) ────────────────────────────── */
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadContent(searchQuery, nextPage);
        }
    }, [loading, hasMore, page, searchQuery, loadContent]);

    /* ── Handlers ──────────────────────────────────────────── */
    const handleItemClick = (item) => {
        if (item.type === 'boltz') navigate(`/boltz/${item.id}`);
        else setSelectedPost(item);
    };

    const handleUserClick = (user) => navigate(`/profile/${user.username}`);

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <MainLayout>
            <div className={styles.exploreContainer}>
                {/* Search Header with Glassmorphism */}
                <div className={styles.searchHeader}>
                    <div className={styles.searchWrapper}>
                        <EnhancedSearchBar
                            onSearch={handleSearch}
                            placeholder="Search posts, people, #hashtags..."
                        />
                    </div>
                </div>

                {/* Tab Bar with Verified Toggle */}
                <div className={styles.controlsBar}>
                    <div className={styles.tabBar} role="tablist">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Verified Only Toggle */}
                    <motion.button
                        className={`${styles.verifiedToggle} ${verifiedOnly ? styles.verifiedToggleActive : ''}`}
                        onClick={() => setVerifiedOnly(!verifiedOnly)}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Shield size={14} />
                        <span>Verified Only</span>
                    </motion.button>
                </div>

                {/* Content Area */}
                <div className={styles.tabContent}>
                    <AnimatePresence mode="wait">
                        {loading && page === 0 ? (
                            <motion.div 
                                key="loading"
                                className={styles.loadingState}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <LoadingSpinner size="md" />
                                <p className={styles.loadingText}>Discovering amazing content...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {activeTab === 'posts' && (
                                    posts.length > 0
                                        ? <MasonryGrid 
                                            items={posts} 
                                            onItemClick={handleItemClick} 
                                            verifiedOnly={verifiedOnly}
                                          />
                                        : <EmptyState type="posts" searchQuery={searchQuery} />
                                )}

                                {activeTab === 'boltz' && (
                                    boltzItems.length > 0
                                        ? <BoltzGrid 
                                            items={boltzItems} 
                                            onItemClick={handleItemClick} 
                                            verifiedOnly={verifiedOnly}
                                          />
                                        : <EmptyState type="boltz" searchQuery={searchQuery} />
                                )}

                                {activeTab === 'users' && (
                                    users.length > 0
                                        ? <UsersList 
                                            users={users} 
                                            onUserClick={handleUserClick} 
                                            verifiedOnly={verifiedOnly}
                                          />
                                        : <EmptyState type="users" searchQuery={searchQuery} />
                                )}

                                {activeTab === 'trending' && (
                                    <TrendingSection posts={posts} searchQuery={searchQuery} />
                                )}
                                
                                {/* Load More Button */}
                                {hasMore && !loading && ['posts', 'boltz'].includes(activeTab) && (
                                    <motion.button
                                        className={styles.loadMoreBtn}
                                        onClick={loadMore}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Load More
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Post Detail Modal */}
                {selectedPost && (
                    <PostDetailModal
                        post={selectedPost}
                        onClose={() => setSelectedPost(null)}
                        onUpdate={(id, updates) => {
                            setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
                        }}
                    />
                )}
            </div>
        </MainLayout>
    );
};

/* ── Empty State Component ──────────────────────────────────── */
const EmptyState = ({ type, searchQuery }) => (
    <motion.div 
        className={styles.emptyState}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <span className={styles.emptyIcon}>
            {type === 'posts' && '📸'}
            {type === 'boltz' && '⚡'}
            {type === 'users' && '👥'}
        </span>
        <p className={styles.emptyTitle}>
            {searchQuery ? EMPTY_MESSAGES.search[0] : EMPTY_MESSAGES[type][0]}
        </p>
        <p className={styles.emptySubtext}>
            {searchQuery ? EMPTY_MESSAGES.search[1] : EMPTY_MESSAGES[type][1]}
        </p>
    </motion.div>
);

export default Explore;
