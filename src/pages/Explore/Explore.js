// Explore - Using Direct REST API (No Supabase JS Client)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { formatNumber } from '../../utils/formatNumber';
import styles from './Explore.module.css';
import MainLayout from '../../components/layout/MainLayout';
import EnhancedSearchBar from '../../components/explore/EnhancedSearchBar';
import PostDetailModal from '../../components/modals/PostDetailModal';

const Explore = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadExploreContent();
    }, []);

    const loadExploreContent = async () => {
        setLoading(true);
        try {
            console.log('🔍 [EXPLORE] Starting with REST API...');

            const headers = {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json'
            };

            // Fetch posts via REST API
            console.log('📊 [EXPLORE] Fetching posts via REST...');
            const postsUrl = `${supabaseUrl}/rest/v1/posts?select=id,user_id,media_url,caption,created_at,type&type=eq.image&media_url=not.is.null&order=created_at.desc&limit=25`;

            const postsRes = await fetch(postsUrl, { headers });
            if (!postsRes.ok) {
                const errorText = await postsRes.text();
                console.error('❌ [EXPLORE] Posts error:', errorText);
            }
            const postsData = postsRes.ok ? await postsRes.json() : [];
            console.log('✅ [EXPLORE] Fetched posts:', postsData.length);

            // Fetch boltz via REST API
            console.log('⚡ [EXPLORE] Fetching boltz via REST...');
            const boltzUrl = `${supabaseUrl}/rest/v1/boltz?select=id,user_id,video_url,thumbnail_url,description,created_at&video_url=not.is.null&order=created_at.desc&limit=25`;

            const boltzRes = await fetch(boltzUrl, { headers });
            const boltzData = boltzRes.ok ? await boltzRes.json() : [];
            console.log('✅ [EXPLORE] Fetched boltz:', boltzData.length);

            // Get unique user IDs
            const userIds = new Set();
            postsData.forEach(p => userIds.add(p.user_id));
            boltzData.forEach(b => userIds.add(b.user_id));

            // Fetch users via REST API
            let usersMap = {};
            if (userIds.size > 0) {
                console.log('👥 [EXPLORE] Fetching users via REST...');
                const userIdsArray = Array.from(userIds);
                const usersUrl = `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name,avatar_url,verified&id=in.(${userIdsArray.join(',')})`;

                const usersRes = await fetch(usersUrl, { headers });
                const usersData = usersRes.ok ? await usersRes.json() : [];

                usersData.forEach(user => {
                    usersMap[user.id] = user;
                });
                console.log('✅ [EXPLORE] Fetched users:', usersData.length);
            }

            // Combine content
            const allContent = [];

            // Add posts
            postsData.forEach(post => {
                allContent.push({
                    id: post.id,
                    type: 'post',
                    media_url: post.media_url,
                    caption: post.caption || '',
                    created_at: post.created_at,
                    user: usersMap[post.user_id] || { username: 'Unknown' }
                });
            });

            // Add boltz
            boltzData.forEach(boltz => {
                console.log('📹 [EXPLORE] Boltz data:', {
                    id: boltz.id,
                    thumbnail_url: boltz.thumbnail_url,
                    video_url: boltz.video_url
                });
                allContent.push({
                    id: boltz.id,
                    type: 'boltz',
                    media_url: boltz.thumbnail_url || boltz.video_url,
                    video_url: boltz.video_url,
                    thumbnail_url: boltz.thumbnail_url,
                    caption: boltz.description,
                    created_at: boltz.created_at,
                    user: usersMap[boltz.user_id] || { username: 'Unknown' }
                });
            });

            // Sort by date
            allContent.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            console.log('✅ [EXPLORE] Total content:', allContent.length);
            setContent(allContent);

            // Fetch suggested users
            console.log('⭐ [EXPLORE] Fetching suggested users via REST...');
            const suggestedUrl = `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name,avatar_url,verified,followers_count&order=followers_count.desc.nullslast&limit=6`;

            const suggestedRes = await fetch(suggestedUrl, { headers });
            const suggestedData = suggestedRes.ok ? await suggestedRes.json() : [];
            console.log('✅ [EXPLORE] Fetched suggested users:', suggestedData.length);
            setSuggestedUsers(suggestedData);

        } catch (error) {
            console.error('❌ [EXPLORE] Error:', error);
        } finally {
            setLoading(false);
            console.log('✅ [EXPLORE] Complete!');
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (!query.trim()) {
            loadExploreContent();
            return;
        }

        console.log('🔍 [EXPLORE] Searching for:', query);
        setLoading(true);

        try {
            const headers = {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json'
            };

            const searchTerm = query.trim();
            console.log('🔍 [SEARCH] Searching for:', searchTerm);

            // Search posts
            console.log('📊 [EXPLORE] Searching posts...');
            const postsUrl = `${supabaseUrl}/rest/v1/posts?select=id,user_id,media_url,caption,created_at,type&type=eq.image&media_url=not.is.null&order=created_at.desc&limit=50`;
            const postsRes = await fetch(postsUrl, { headers });
            let postsData = postsRes.ok ? await postsRes.json() : [];
            console.log('📊 [SEARCH] Fetched', postsData.length, 'posts');
            if (postsData.length > 0) console.log('📊 [SEARCH] First post caption:', postsData[0].caption);

            // Filter posts by caption
            postsData = postsData.filter(post => {
                if (!post.caption) {
                    console.log('⚠️ [SEARCH] Post has no caption:', post.id);
                    return false;
                }
                const matches = post.caption.toLowerCase().includes(searchTerm.toLowerCase());
                console.log(`📊 [SEARCH] Post "${post.caption}" matches "${searchTerm}"? ${matches}`);
                return matches;
            });
            console.log('✅ [EXPLORE] Found posts:', postsData.length);

            // Search boltz
            console.log('⚡ [EXPLORE] Searching boltz...');
            const boltzUrl = `${supabaseUrl}/rest/v1/boltz?select=id,user_id,video_url,thumbnail_url,description,created_at&video_url=not.is.null&order=created_at.desc&limit=50`;
            const boltzRes = await fetch(boltzUrl, { headers });
            let boltzData = boltzRes.ok ? await boltzRes.json() : [];
            console.log('⚡ [SEARCH] Fetched', boltzData.length, 'boltz');
            if (boltzData.length > 0) console.log('⚡ [SEARCH] First boltz description:', boltzData[0].description);

            // Filter boltz by description
            boltzData = boltzData.filter(boltz => {
                if (!boltz.description) {
                    console.log('⚠️ [SEARCH] Boltz has no description:', boltz.id);
                    return false;
                }
                const matches = boltz.description.toLowerCase().includes(searchTerm.toLowerCase());
                console.log(`⚡ [SEARCH] Boltz "${boltz.description}" matches "${searchTerm}"? ${matches}`);
                return matches;
            });
            console.log('✅ [EXPLORE] Found boltz:', boltzData.length);

            // Search users
            const usersUrl = `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name,avatar_url,verified,followers_count&username=ilike.*${searchTerm}*&limit=20`;
            const usersRes = await fetch(usersUrl, { headers });
            const searchedUsers = usersRes.ok ? await usersRes.json() : [];

            // Get user profiles
            const userIds = new Set();
            postsData.forEach(p => userIds.add(p.user_id));
            boltzData.forEach(b => userIds.add(b.user_id));

            let usersMap = {};
            if (userIds.size > 0) {
                const profilesUrl = `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name,avatar_url,verified&id=in.(${Array.from(userIds).join(',')})`;
                const profilesRes = await fetch(profilesUrl, { headers });
                const profilesData = profilesRes.ok ? await profilesRes.json() : [];
                profilesData.forEach(user => { usersMap[user.id] = user; });
            }

            // Combine results
            const searchResults = [];
            postsData.forEach(post => {
                searchResults.push({
                    id: post.id,
                    type: 'post',
                    media_url: post.media_url,
                    caption: post.caption || '',
                    created_at: post.created_at,
                    user: usersMap[post.user_id] || { username: 'Unknown' }
                });
            });

            boltzData.forEach(boltz => {
                searchResults.push({
                    id: boltz.id,
                    type: 'boltz',
                    media_url: boltz.thumbnail_url || boltz.video_url,
                    video_url: boltz.video_url,
                    thumbnail_url: boltz.thumbnail_url,
                    caption: boltz.description,
                    created_at: boltz.created_at,
                    user: usersMap[boltz.user_id] || { username: 'Unknown' }
                });
            });

            searchResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setContent(searchResults);
            setSuggestedUsers(searchedUsers);

        } catch (error) {
            console.error('❌ [EXPLORE] Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePost = (postId, updates) => {
        setContent(prev => prev.map(post => {
            if (post.id === postId) {
                const newPost = { ...post, ...updates };
                // Handle deltas for counts
                if (updates.likes_count_delta !== undefined) {
                    newPost.likes_count = (post.likes_count || 0) + updates.likes_count_delta;
                }
                if (updates.saves_count_delta !== undefined) {
                    newPost.saves_count = (post.saves_count || 0) + updates.saves_count_delta;
                }
                if (updates.comments_count_delta !== undefined) {
                    newPost.comments_count = (post.comments_count || 0) + updates.comments_count_delta;
                }

                // If the selected post is being updated, sync it too
                if (selectedPost && selectedPost.id === postId) {
                    setSelectedPost(newPost);
                }

                return newPost;
            }
            return post;
        }));
    };

    const handlePostClick = (item) => {
        if (item.type === 'boltz') {
            navigate(`/boltz/${item.id}`);
        } else {
            setSelectedPost(item);
        }
    };

    const handleCloseModal = () => {
        setSelectedPost(null);
    };

    return (
        <MainLayout>
            <div className={styles.exploreContainer}>
                <div className={styles.searchHeader}>
                    <EnhancedSearchBar onSearch={handleSearch} />
                </div>

                <div className={styles.mainContent}>
                    {suggestedUsers.length > 0 && (
                        <section className={styles.suggestedSection}>
                            <h2 className={styles.sectionTitle}>
                                <span className={styles.icon}>⭐</span>
                                Suggested For You
                            </h2>
                            <div className={styles.usersGrid}>
                                {suggestedUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={styles.userCard}
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                    >
                                        <img
                                            src={user.avatar_url || '/default-avatar.png'}
                                            alt={user.username}
                                            className={styles.userAvatar}
                                        />
                                        <div className={styles.userInfo}>
                                            <div className={styles.userName}>
                                                {user.username}
                                                {user.verified && <span className={styles.verified}>✓</span>}
                                            </div>
                                            {user.full_name && (
                                                <div className={styles.userFullName}>{user.full_name}</div>
                                            )}
                                            <div className={styles.userFollowers}>
                                                {formatNumber(user.followers_count || 0)} followers
                                            </div>
                                        </div>
                                        <button className={styles.followBtn}>Follow</button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading explore...</p>
                        </div>
                    ) : content.length > 0 ? (
                        <section className={styles.postsSection}>
                            <h2 className={styles.sectionTitle}>
                                <span className={styles.icon}>🔥</span>
                                Discover
                            </h2>
                            <div className={styles.postsGrid}>
                                {content.map(item => (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={styles.postCard}
                                        onClick={() => handlePostClick(item)}
                                    >
                                        {item.type === 'boltz' ? (
                                            <div className={styles.boltzThumbnail}>
                                                <video
                                                    src={item.video_url}
                                                    className={styles.postImage}
                                                    muted
                                                    playsInline
                                                />
                                                <div className={styles.boltzPlayIcon}>▶</div>
                                            </div>
                                        ) : (
                                            <img
                                                src={item.media_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23333" width="400" height="400"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                                                alt={item.caption || 'Content'}
                                                className={styles.postImage}
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23333" width="400" height="400"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                        )}
                                        {item.type === 'boltz' && (
                                            <div className={styles.boltzBadge}>⚡</div>
                                        )}
                                        <div className={styles.postOverlay}>
                                            <div className={styles.postUser}>
                                                <img
                                                    src={item.user?.avatar_url || '/default-avatar.png'}
                                                    alt={item.user?.username}
                                                    className={styles.postUserAvatar}
                                                />
                                                <span className={styles.postUsername}>
                                                    {item.user?.username}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <h3>No content yet</h3>
                            <p>Be the first to share something!</p>
                        </div>
                    )}
                </div>

                {selectedPost && (
                    <PostDetailModal
                        post={selectedPost}
                        onClose={handleCloseModal}
                        onUpdate={handleUpdatePost}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default Explore;
