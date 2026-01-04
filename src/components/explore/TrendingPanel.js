// TrendingPanel - Real Data with Focus Lavender Theme
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { formatNumber } from '../../utils/formatNumber';
import styles from './TrendingPanel.module.css';

const TrendingPanel = () => {
    const navigate = useNavigate();
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [trendingCreators, setTrendingCreators] = useState([]);
    const [viralPosts, setViralPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrendingData();
    }, []);

    const loadTrendingData = async () => {
        setLoading(true);

        try {
            // Fetch trending creators (most followed users)
            const creatorsUrl = `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name,avatar_url,verified,followers_count&order=followers_count.desc.nullslast&limit=6`;
            const creatorsRes = await fetch(creatorsUrl, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                }
            });

            if (creatorsRes.ok) {
                const creators = await creatorsRes.json();
                setTrendingCreators(creators || []);
            } else {
                console.warn('Failed to fetch trending creators:', await creatorsRes.text());
                setTrendingCreators([]);
            }

            // Fetch viral posts (most recent posts with media)
            // FIXED: Using media_url (singular) and including both 'post' and 'image' types
            const postsUrl = `${supabaseUrl}/rest/v1/posts?select=id,media_url,type&type=in.(post,image)&media_url=not.is.null&order=created_at.desc&limit=6`;
            const postsRes = await fetch(postsUrl, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                }
            });

            if (postsRes.ok) {
                const posts = await postsRes.json();
                console.log('✅ Viral posts fetched:', posts.length);
                // Add default counts
                const postsWithCounts = posts.map(post => ({
                    ...post,
                    likes_count: 0,
                    comments_count: 0,
                    thumbnail_url: post.media_url || null
                }));
                setViralPosts(postsWithCounts || []);
            } else {
                const errorText = await postsRes.text();
                console.warn('Failed to fetch viral posts:', errorText);
                setViralPosts([]);
            }

            // TODO: Implement real hashtag tracking
            // For now, hide trending hashtags until we have real data
            setTrendingHashtags([]);

        } catch (error) {
            console.error('Error loading trending data:', error);
            // Set empty arrays on error
            setTrendingCreators([]);
            setViralPosts([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <span className={styles.spinner}>⏳</span>
                    <span>Loading trending content...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Trending Hashtags */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>🔥 Trending Hashtags</h2>
                    <span className={styles.sectionSubtitle}>What's hot right now</span>
                </div>
                <div className={styles.hashtagGrid}>
                    {trendingHashtags.map((hashtag, idx) => (
                        <div key={idx} className={styles.hashtagCard}>
                            <div className={styles.hashtagRank}>#{idx + 1}</div>
                            <div className={styles.hashtagInfo}>
                                <div className={styles.hashtagName}>#{hashtag.tag}</div>
                                <div className={styles.hashtagStats}>
                                    <span className={styles.hashtagCount}>{formatNumber(hashtag.count)} posts</span>
                                    <span className={styles.hashtagGrowth}>{hashtag.growth}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Trending Creators */}
            {trendingCreators.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>⭐ Trending Creators</h2>
                        <span className={styles.sectionSubtitle}>Rising stars</span>
                    </div>
                    <div className={styles.creatorsGrid}>
                        {trendingCreators.map(creator => (
                            <div
                                key={creator.id}
                                className={styles.creatorCard}
                                onClick={() => navigate(`/profile/${creator.username}`)}
                            >
                                <img
                                    src={creator.avatar_url || '/default-avatar.png'}
                                    alt={creator.username}
                                    className={styles.creatorAvatar}
                                />
                                <div className={styles.creatorInfo}>
                                    <div className={styles.creatorName}>
                                        {creator.username}
                                        {creator.verified && <span className={styles.verified}>✓</span>}
                                    </div>
                                    {creator.full_name && (
                                        <div className={styles.creatorFullName}>{creator.full_name}</div>
                                    )}
                                    <div className={styles.creatorFollowers}>
                                        {formatNumber(creator.followers_count || 0)} followers
                                    </div>
                                </div>
                                <button className={styles.followBtn}>Follow</button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Viral Posts */}
            {viralPosts.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🚀 Viral Posts</h2>
                        <span className={styles.sectionSubtitle}>Most engaging content</span>
                    </div>
                    <div className={styles.viralGrid}>
                        {viralPosts.map(post => {
                            const thumbnail = post.thumbnail_url || post.media_url;
                            return (
                                <div key={post.id} className={styles.viralCard}>
                                    <img
                                        src={thumbnail || 'https://picsum.photos/400/400'}
                                        alt="Viral post"
                                        className={styles.viralThumbnail}
                                    />
                                    <div className={styles.viralOverlay}>
                                        <div className={styles.viralStats}>
                                            <span className={styles.viralStat}>
                                                ❤️ {formatNumber(post.likes_count || 0)}
                                            </span>
                                            <span className={styles.viralStat}>
                                                💬 {formatNumber(post.comments_count || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default TrendingPanel;
