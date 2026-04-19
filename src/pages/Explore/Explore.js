/**
 * Explore — Focus App v2.0
 *
 * Separate tabs: Posts | Boltz | Users | Hashtags
 * Clean: zero console.logs in production code
 * Search: debounced + per-tab results
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { getAuthToken } from '../../utils/supabaseRest';
import { formatNumber } from '../../utils/formatNumber';
import styles from './Explore.module.css';
import MainLayout from '../../components/layout/MainLayout';
import EnhancedSearchBar from '../../components/explore/EnhancedSearchBar';
import PostDetailModal from '../../components/modals/PostDetailModal';
import UserAvatar from '../../components/ui/Avatar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

/* ── Constants ─────────────────────────────────────────────── */
const TABS = [
    { id: 'posts',    label: '📸 Posts',    },
    { id: 'boltz',    label: '⚡ Boltz',    },
    { id: 'users',    label: '👥 Users',    },
    { id: 'trending', label: '🔥 Trending', },
];

const apiFetch = async (path) => {
    const token = await getAuthToken();
    const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) return [];
    return res.json();
};

/* ── Masonry Grid ───────────────────────────────────────────── */
const MasonryGrid = ({ items, onItemClick }) => (
    <div className={styles.masonryGrid}>
        {items.map(item => (
            <div
                key={`${item.type}-${item.id}`}
                className={styles.masonryItem}
                onClick={() => onItemClick(item)}
            >
                {item.type === 'boltz' ? (
                    <div className={styles.boltzThumb}>
                        <video
                            src={item.video_url}
                            className={styles.thumbMedia}
                            muted playsInline preload="none"
                        />
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
                <div className={styles.thumbOverlay}>
                    <span className={styles.thumbUser}>@{item.user?.username}</span>
                </div>
            </div>
        ))}
    </div>
);

/* ── Boltz Grid (2-col) ────────────────────────────────────── */
const BoltzGrid = ({ items, onItemClick }) => (
    <div className={styles.boltzGrid}>
        {items.map(item => (
            <div
                key={item.id}
                className={styles.boltzGridItem}
                onClick={() => onItemClick(item)}
            >
                {item.video_url ? (
                    <video
                        src={item.video_url}
                        className={styles.boltzGridVideo}
                        muted playsInline preload="none"
                        onMouseEnter={e => e.target.play()}
                        onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                    />
                ) : item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.description || 'Boltz'} className={styles.boltzGridVideo} />
                ) : (
                    <div className={styles.textPost}><p>⚡ Boltz</p></div>
                )}
                <div className={styles.boltzGridOverlay}>
                    <span>▶</span>
                    <span className={styles.boltzGridUser}>@{item.user?.username || 'user'}</span>
                </div>
            </div>
        ))}
    </div>
);

/* ── Users List ─────────────────────────────────────────────── */
const UsersList = ({ users, onUserClick }) => (
    <div className={styles.usersList}>
        {users.map(user => (
            <div
                key={user.id}
                className={styles.userRow}
                onClick={() => onUserClick(user)}
            >
                <UserAvatar
                    src={user.avatar_url}
                    username={user.username}
                    fullName={user.full_name}
                    size="md"
                />
                <div className={styles.userMeta}>
                    <span className={styles.userDisplayName}>
                        {user.full_name || user.username}
                        {user.is_verified && <span className={styles.verifiedBadge}>✓</span>}
                    </span>
                    <span className={styles.userHandle}>@{user.username}</span>
                    <span className={styles.userFollowers}>
                        {formatNumber(user.followers_count || 0)} followers
                    </span>
                </div>
                <button className={styles.followBtn}>Follow</button>
            </div>
        ))}
    </div>
);

/* ── Trending Hashtags ──────────────────────────────────────── */
const TrendingSection = ({ posts }) => {
    const hashtags = React.useMemo(() => {
        const tagCount = {};
        posts.forEach(p => {
            const tags = (p.caption || '').match(/#\w+/g) || [];
            tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
        });
        return Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
    }, [posts]);

    return (
        <div className={styles.trendingSection}>
            <h3 className={styles.trendingTitle}>Trending Hashtags</h3>
            <div className={styles.hashtagGrid}>
                {hashtags.map(([tag, count]) => (
                    <div key={tag} className={styles.hashtagChip}>
                        <span className={styles.hashtagName}>{tag}</span>
                        <span className={styles.hashtagCount}>{formatNumber(count)} posts</span>
                    </div>
                ))}
                {hashtags.length === 0 && (
                    <p className={styles.emptyText}>No trending hashtags yet</p>
                )}
            </div>
        </div>
    );
};

/* ── Main Explore Page ──────────────────────────────────────── */
const Explore = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [boltzItems, setBoltzItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPost, setSelectedPost] = useState(null);
    const searchTimeout = useRef(null);

    /* ── Initial load ──────────────────────────────────────── */
    const loadContent = useCallback(async (query = '') => {
        setLoading(true);
        try {
            const q = query.trim().toLowerCase();
            // ── Posts: no type filter, no media_url filter — show ALL posts ──
            const [postsData, boltzData, usersData] = await Promise.all([
                q
                    ? apiFetch(`/posts?select=id,user_id,media_url,caption,created_at,type&caption=ilike.*${q}*&order=created_at.desc&limit=40`)
                    : apiFetch(`/posts?select=id,user_id,media_url,caption,created_at,type&order=created_at.desc&limit=40`),

                q
                    ? apiFetch(`/boltz?select=id,user_id,video_url,thumbnail_url,description,created_at&description=ilike.*${q}*&order=created_at.desc&limit=40`)
                    : apiFetch(`/boltz?select=id,user_id,video_url,thumbnail_url,description,created_at&order=created_at.desc&limit=40`),

                apiFetch(`/profiles?select=id,username,full_name,avatar_url,is_verified,followers_count${q ? `&or=(username.ilike.*${q}*,full_name.ilike.*${q}*)` : ''}&order=followers_count.desc.nullslast&limit=20`),
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
                    `/profiles?select=id,username,full_name,avatar_url,is_verified&id=in.(${userIds.join(',')})`
                );
                profiles.forEach(p => { profilesMap[p.id] = p; });
            }

            setPosts(
                postsData.map(p => ({
                    ...p,
                    type: p.type || 'post',
                    user: profilesMap[p.user_id] || null,
                }))
            );

            setBoltzItems(
                boltzData.map(b => ({
                    ...b,
                    type: 'boltz',
                    media_url: b.thumbnail_url || b.video_url,
                    user: profilesMap[b.user_id] || null,
                }))
            );

            setUsers(usersData);
        } catch (err) {
            console.warn('Explore load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadContent(); }, [loadContent]);

    /* ── Debounced search ──────────────────────────────────── */
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => loadContent(query), 400);
    }, [loadContent]);

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
                {/* Search bar */}
                <div className={styles.searchHeader}>
                    <EnhancedSearchBar
                        onSearch={handleSearch}
                        placeholder="Search posts, people, #hashtags..."
                    />
                </div>

                {/* Tab bar */}
                <div className={styles.tabBar} role="tablist">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={styles.tabContent}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <LoadingSpinner size="md" />
                            <p className={styles.loadingText}>Discovering content...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'posts' && (
                                posts.length > 0
                                    ? <MasonryGrid items={posts} onItemClick={handleItemClick} />
                                    : <div className={styles.emptyState}>
                                          <span className={styles.emptyIcon}>📸</span>
                                          <p>{searchQuery ? 'No posts match your search' : 'No posts to discover yet'}</p>
                                      </div>
                            )}

                            {activeTab === 'boltz' && (
                                boltzItems.length > 0
                                    ? <BoltzGrid items={boltzItems} onItemClick={handleItemClick} />
                                    : <div className={styles.emptyState}>
                                          <span className={styles.emptyIcon}>⚡</span>
                                          <p>{searchQuery ? 'No Boltz match your search' : 'No Boltz to discover yet'}</p>
                                      </div>
                            )}

                            {activeTab === 'users' && (
                                users.length > 0
                                    ? <UsersList users={users} onUserClick={handleUserClick} />
                                    : <div className={styles.emptyState}>
                                          <span className={styles.emptyIcon}>👥</span>
                                          <p>{searchQuery ? 'No users match your search' : 'No users found'}</p>
                                      </div>
                            )}

                            {activeTab === 'trending' && (
                                <TrendingSection posts={posts} />
                            )}
                        </>
                    )}
                </div>

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

export default Explore;
