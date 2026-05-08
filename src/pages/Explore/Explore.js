/**
 * EXPLORE — SOVEREIGN DISCOVERY ARCHITECTURE
 * H2 Universal Theme | Trust Shield | God-Level Edition
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, Users, Image, Zap, Compass } from 'lucide-react';
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

const TABS = [
    { id: 'posts', label: 'Posts', icon: Image },
    { id: 'boltz', label: 'Boltz', icon: Zap },
    { id: 'users', label: 'People', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
];
const ITEMS_PER_PAGE = 20;
const DEBOUNCE_MS = 300;
const TRUST_BOOST = 1.2;
const EMPTY_MSG = {
    posts: ['No posts discovered yet', 'Be the first to share something amazing! ✨'],
    boltz: ['No Boltz videos yet', 'Create short-form content that pops! ⚡'],
    users: ['No people found', 'Invite friends to join Focus! 👥'],
    trending: ['Trending loading...', "Discover what's buzzing! 🔥"],
    search: ["Couldn't find that!", 'Try a different search term 🔍'],
};

const apiFetch = async (path) => {
    try {
        const token = await getAuthToken();
        const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
            headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
};

const calcScore = (item) => {
    let s = (item.likes_count || 0) + (item.comments_count || 0) * 2 + (item.shares_count || 0) * 3 + (item.views_count || 0) * 0.1;
    if (item.user?.is_verified || item.user?.trust_tier >= 4) s *= TRUST_BOOST;
    const hrs = (Date.now() - new Date(item.created_at).getTime()) / 36e5;
    if (hrs < 24) s *= 1.1;
    return s;
};

/* ── SUB-COMPONENTS ─────────────────────────────────────────── */
const MasonryGrid = ({ items, onItemClick, verifiedOnly }) => {
    const [errored, setErrored] = useState({});
    const sorted = useMemo(() => [...items].sort((a, b) => calcScore(b) - calcScore(a)), [items]);
    const filtered = verifiedOnly ? sorted.filter(i => i.user?.is_verified || i.user?.trust_tier >= 4) : sorted;

    return (
        <div className={styles.masonryGrid}>
            <AnimatePresence>
                {filtered.map((item, i) => (
                    <motion.div key={`${item.type}-${item.id}`} className={styles.masonryItem} onClick={() => onItemClick(item)}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }} whileHover={{ scale: 1.02 }}>
                        {item.type === 'boltz' ? (
                            <div className={styles.boltzThumb}>
                                {item.video_url ? (
                                    <video src={item.video_url} className={styles.thumbMedia} muted playsInline preload="metadata" poster={item.thumbnail_url || ''}
                                        onLoadedMetadata={e => { try { e.currentTarget.currentTime = 0.001; e.currentTarget.pause(); } catch {} }}
                                        onError={() => setErrored(p => ({ ...p, [item.id]: true }))} />
                                ) : (!errored[item.id] && (item.thumbnail_url || item.media_url)) ? (
                                    <img src={item.thumbnail_url || item.media_url} alt={item.caption || 'Boltz'} className={styles.thumbMedia} loading="lazy"
                                        onError={() => setErrored(p => ({ ...p, [item.id]: true }))} />
                                ) : (<div className={styles.thumbPlaceholder}>⚡</div>)}
                                <div className={styles.boltzBadge}>⚡ Boltz</div>
                                <div className={styles.playOverlay}>▶</div>
                            </div>
                        ) : (
                            <img src={item.media_url} alt={item.caption || 'Post'} className={styles.thumbMedia} loading="lazy"
                                onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div className={styles.thumbOverlay}>
                            <div className={styles.overlayContent}>
                                <UserAvatar src={item.user?.avatar_url} username={item.user?.username} fullName={item.user?.full_name} size="sm" isVerified={item.user?.is_verified} className={styles.overlayAvatar} />
                                <div className={styles.overlayMeta}>
                                    <span className={styles.thumbUser}>@{item.user?.username}</span>
                                    {item.user?.is_verified && <Shield size={11} className={styles.trustShieldIcon} />}
                                </div>
                            </div>
                        </div>
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

const BoltzGrid = ({ items, onItemClick, verifiedOnly }) => {
    const [errored, setErrored] = useState({});
    const sorted = useMemo(() => [...items].sort((a, b) => calcScore(b) - calcScore(a)), [items]);
    const filtered = verifiedOnly ? sorted.filter(i => i.user?.is_verified || i.user?.trust_tier >= 4) : sorted;

    return (
        <div className={styles.boltzGrid}>
            <AnimatePresence>
                {filtered.map((item, i) => (
                    <motion.div key={item.id} className={styles.boltzGridItem} onClick={() => onItemClick(item)}
                        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileHover={{ scale: 1.03 }}>
                        {item.video_url ? (
                            <video src={item.video_url} className={styles.boltzGridThumb} muted playsInline preload="metadata"
                                onLoadedMetadata={e => { try { e.currentTarget.currentTime = 0.001; } catch {} }} />
                        ) : (!errored[item.id] && (item.thumbnail_url || item.media_url)) ? (
                            <img src={item.thumbnail_url || item.media_url} alt="Boltz" className={styles.boltzGridThumb}
                                onError={() => setErrored(p => ({ ...p, [item.id]: true }))} />
                        ) : (
                            <div className={styles.boltzGridThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                                <span style={{ fontSize: 32 }}>⚡</span>
                            </div>
                        )}
                        {item.video_url && (
                            <video src={item.video_url} className={styles.boltzGridVideo} muted playsInline preload="none" loop
                                onMouseEnter={e => { e.target.style.opacity = '1'; e.target.play(); }}
                                onMouseLeave={e => { e.target.style.opacity = '0'; e.target.pause(); e.target.currentTime = 0; }}
                                style={{ opacity: 0, transition: 'opacity 0.3s' }} />
                        )}
                        <div className={styles.boltzGridOverlay}>
                            <span>▶</span>
                            <span className={styles.boltzGridUser}>@{item.user?.username || 'user'}</span>
                            {item.user?.is_verified && <Shield size={14} className={styles.boltzTrustShield} />}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const UsersList = ({ users, onUserClick, verifiedOnly }) => {
    const sorted = useMemo(() => [...users].sort((a, b) => {
        const av = a.is_verified || (a.trust_tier || 0) >= 4;
        const bv = b.is_verified || (b.trust_tier || 0) >= 4;
        if (av && !bv) return -1; if (!av && bv) return 1;
        return (b.followers_count || 0) - (a.followers_count || 0);
    }), [users]);
    const filtered = verifiedOnly ? sorted.filter(u => u.is_verified || (u.trust_tier || 0) >= 4) : sorted;

    return (
        <div className={styles.usersList}>
            <AnimatePresence>
                {filtered.map((user, i) => (
                    <motion.div key={user.id} className={styles.userRow} onClick={() => onUserClick(user)}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ scale: 1.01 }}>
                        <UserAvatar src={user.avatar_url} username={user.username} fullName={user.full_name} size="md" isVerified={user.is_verified} />
                        <div className={styles.userMeta}>
                            <span className={styles.userDisplayName}>
                                {user.full_name || user.username}
                                {user.is_verified && <Shield size={14} className={styles.verifiedBadgeIcon} />}
                            </span>
                            <span className={styles.userHandle}>@{user.username}</span>
                            <span className={styles.userFollowers}>
                                {formatNumber(user.followers_count || 0)} followers
                                {user.trust_tier >= 4 && <span className={styles.trustTierBadge}>Trust Tier {user.trust_tier}</span>}
                            </span>
                        </div>
                        <button className={styles.followBtn}>Follow</button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const TrendingSection = ({ posts, searchQuery }) => {
    const data = useMemo(() => {
        const tags = {};
        const cutoff = Date.now() - 864e5;
        posts.forEach(p => {
            const recent = new Date(p.created_at).getTime() > cutoff;
            ((p.caption || '').match(/#\w+/g) || []).forEach(t => {
                const k = t.toLowerCase();
                if (!tags[k]) tags[k] = { count: 0, recent: 0, eng: 0 };
                tags[k].count++;
                if (recent) tags[k].recent++;
                tags[k].eng += (p.likes_count || 0) + (p.comments_count || 0) * 2 + (p.shares_count || 0) * 3;
            });
        });
        return Object.entries(tags).map(([tag, s]) => ({
            tag, displayTag: tag, count: s.count, recentCount: s.recent,
            engagement: s.eng, score: s.recent * 2 + s.eng * 0.1,
        })).sort((a, b) => b.score - a.score).slice(0, 20);
    }, [posts]);

    return (
        <div className={styles.trendingSection}>
            <div className={styles.trendingHeader}>
                <h3 className={styles.trendingTitle}><TrendingUp size={18} /> Trending Now</h3>
                <span className={styles.trendingSubtitle}>Last 24 hours</span>
            </div>
            <div className={styles.hashtagGrid}>
                <AnimatePresence>
                    {data.map((item, i) => (
                        <motion.div key={item.tag} className={styles.hashtagChip}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            whileHover={{ scale: 1.01, borderColor: 'rgba(139,92,246,0.5)' }}>
                            <div className={styles.hashtagRank}>#{i + 1}</div>
                            <div className={styles.hashtagInfo}>
                                <span className={styles.hashtagName}>{item.displayTag}</span>
                                <span className={styles.hashtagMeta}>{formatNumber(item.recentCount)} new · {formatNumber(item.count)} total</span>
                            </div>
                            <div className={styles.hashtagEngagement}>🔥 {Math.round(item.score)}</div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {data.length === 0 && (
                    <EmptyState type="trending" searchQuery={searchQuery} />
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ type, searchQuery }) => (
    <motion.div className={styles.emptyState} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <span className={styles.emptyIcon}>
            {type === 'posts' && '📸'}{type === 'boltz' && '⚡'}{type === 'users' && '👥'}{type === 'trending' && '🔥'}
        </span>
        <p className={styles.emptyTitle}>{searchQuery ? EMPTY_MSG.search[0] : EMPTY_MSG[type]?.[0]}</p>
        <p className={styles.emptySubtext}>{searchQuery ? EMPTY_MSG.search[1] : EMPTY_MSG[type]?.[1]}</p>
    </motion.div>
);

const SkeletonGrid = () => (
    <div className={styles.skeletonGrid}>
        {Array.from({ length: 12 }).map((_, i) => <div key={i} className={styles.skeletonItem} />)}
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPLORE PAGE
   ═══════════════════════════════════════════════════════════════ */
const Explore = () => {
    const navigate = useNavigate();
    const { user } = useFocusUser();
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

    const loadContent = useCallback(async (query = '', pageNum = 0) => {
        setLoading(true);
        try {
            const q = query.trim().toLowerCase();
            const from = pageNum * ITEMS_PER_PAGE;
            const postsQuery = `/posts?select=id,user_id,media_url,caption,created_at,type,likes_count,comments_count,shares_count,views_count&is_flagged=eq.false${q ? `&caption=ilike.*${q}*` : ''}&order=created_at.desc&limit=${ITEMS_PER_PAGE}&offset=${from}`;
            const usersQuery = `/profiles?select=id,username,full_name,avatar_url,is_verified,trust_tier,followers_count${q ? `&or=(username.ilike.*${q}*,full_name.ilike.*${q}*)` : ''}&order=followers_count.desc.nullslast&limit=20`;

            const [postsData, usersData, boltzData] = await Promise.all([
                apiFetch(postsQuery), apiFetch(usersQuery), fetchBoltzPreview(ITEMS_PER_PAGE, from),
            ]);

            const userIds = [...new Set([...postsData.map(p => p.user_id), ...boltzData.map(b => b.user_id)].filter(Boolean))];
            const profilesMap = {};
            if (userIds.length > 0) {
                const profiles = await apiFetch(`/profiles?select=id,username,full_name,avatar_url,is_verified,trust_tier&id=in.(${userIds.join(',')})`);
                profiles.forEach(p => { profilesMap[p.id] = p; });
            }

            const enrichedPosts = postsData.map(p => ({ ...p, type: p.type || 'post', user: profilesMap[p.user_id] || null }));
            const enrichedBoltz = boltzData.map(b => ({
                ...b, type: 'boltz',
                media_url: b._previewThumb || b.thumbnail_url || b.video_url || null,
                thumbnail_url: b._previewThumb || b.thumbnail_url || null,
                video_url: b._videoFallback || b.video_url || null,
                user: profilesMap[b.user_id] || b.profiles || null,
            }));

            if (pageNum === 0) { setPosts(enrichedPosts); setBoltzItems(enrichedBoltz); setUsers(usersData); }
            else { setPosts(prev => [...prev, ...enrichedPosts]); setBoltzItems(prev => [...prev, ...enrichedBoltz]); }
            setHasMore(postsData.length === ITEMS_PER_PAGE || boltzData.length === ITEMS_PER_PAGE);
        } catch (err) { console.warn('Explore load error:', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadContent(); }, [loadContent]);

    const handleSearch = useCallback((query) => {
        setSearchQuery(query); setPage(0);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => loadContent(query, 0), DEBOUNCE_MS);
    }, [loadContent]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) { const next = page + 1; setPage(next); loadContent(searchQuery, next); }
    }, [loading, hasMore, page, searchQuery, loadContent]);

    const handleItemClick = (item) => { item.type === 'boltz' ? navigate(`/boltz/${item.id}`) : setSelectedPost(item); };
    const handleUserClick = (u) => navigate(`/profile/${u.username}`);

    return (
        <MainLayout>
            <div className={styles.sovereignContainer}>
                <div className={styles.glassBackdrop} />
                <div className={styles.contentStack}>
                    {/* Hero Header */}
                    <motion.header className={styles.heroHeader} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <div className={styles.heroTitle}>
                            <Compass size={24} className={styles.heroTitleIcon} style={{ color: 'var(--primary-light)' }} />
                            <h1 className={styles.heroTitleText}>Explore</h1>
                        </div>
                        <div className={styles.searchWrapper}>
                            <EnhancedSearchBar onSearch={handleSearch} placeholder="Search posts, people, #hashtags..." />
                        </div>
                        {/* Controls */}
                        <div className={styles.controlsBar}>
                            <div className={styles.tabBar} role="tablist">
                                {TABS.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button key={tab.id} role="tab" aria-selected={activeTab === tab.id}
                                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                                            onClick={() => setActiveTab(tab.id)}>
                                            <Icon size={14} /><span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <motion.button className={`${styles.verifiedToggle} ${verifiedOnly ? styles.verifiedToggleActive : ''}`}
                                onClick={() => setVerifiedOnly(!verifiedOnly)} whileTap={{ scale: 0.95 }}>
                                <Shield size={13} /><span>Verified</span>
                            </motion.button>
                        </div>
                    </motion.header>

                    {/* Content */}
                    <div className={styles.tabContent}>
                        <AnimatePresence mode="wait">
                            {loading && page === 0 ? (
                                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <SkeletonGrid />
                                </motion.div>
                            ) : (
                                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {activeTab === 'posts' && (posts.length > 0
                                        ? <MasonryGrid items={posts} onItemClick={handleItemClick} verifiedOnly={verifiedOnly} />
                                        : <EmptyState type="posts" searchQuery={searchQuery} />)}
                                    {activeTab === 'boltz' && (boltzItems.length > 0
                                        ? <BoltzGrid items={boltzItems} onItemClick={handleItemClick} verifiedOnly={verifiedOnly} />
                                        : <EmptyState type="boltz" searchQuery={searchQuery} />)}
                                    {activeTab === 'users' && (users.length > 0
                                        ? <UsersList users={users} onUserClick={handleUserClick} verifiedOnly={verifiedOnly} />
                                        : <EmptyState type="users" searchQuery={searchQuery} />)}
                                    {activeTab === 'trending' && <TrendingSection posts={posts} searchQuery={searchQuery} />}
                                    {hasMore && !loading && ['posts', 'boltz'].includes(activeTab) && (
                                        <motion.button className={styles.loadMoreBtn} onClick={loadMore}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            Load More
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {selectedPost && (
                    <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)}
                        onUpdate={(id, updates) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p)); }} />
                )}
            </div>
        </MainLayout>
    );
};

export default Explore;
