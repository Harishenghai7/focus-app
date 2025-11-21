import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { components, utils } from '../importMap';
import { supabase } from '../supabaseClient';
import './Trending.css';

const {
  TrendingSection,
  PostCard,
  SkeletonLoader,
  ErrorBoundary,
  EmptyState
} = components;

const {
  trendingService,
  trackEvent,
  trackPageView
} = utils;

// Category filters for trending content
const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'posts', label: 'Posts', icon: '📝' },
  { id: 'photos', label: 'Photos', icon: '📷' },
  { id: 'videos', label: 'Videos', icon: '🎥' },
  { id: 'boltz', label: 'Boltz', icon: '⚡' },
  { id: 'hashtags', label: 'Hashtags', icon: '#️⃣' },
  { id: 'people', label: 'People', icon: '👥' }
];

// Timeframe filters
const TIMEFRAME_FILTERS = [
  { id: 'day', label: 'Today', icon: '📅' },
  { id: 'week', label: 'This Week', icon: '📊' },
  { id: 'month', label: 'This Month', icon: '📈' }
];

export default function Trending({ user, userProfile }) {
  const navigate = useNavigate();

  // Track page view
  useEffect(() => {
    trackPageView?.('Trending');
  }, []);

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('week');
  
  // Trending data
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [trendingBoltz, setTrendingBoltz] = useState([]);

  // Fetch all trending data
  const fetchTrendingData = useCallback(async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) {
      setRefreshing(true);
      trackEvent?.('trending_refresh', { timeframe, category: categoryFilter });
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      // Fetch trending hashtags
      const hashtags = await trendingService.getTrendingHashtags(20);
      setTrendingHashtags(hashtags || []);

      // Fetch trending posts
      const posts = await trendingService.getTrendingPosts(30, timeframe);
      setTrendingPosts(posts || []);

      // Fetch trending users (by follower count and recent activity)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, fullname, avatarurl, bio, isverified, followercount')
        .neq('id', user.id)
        .order('followercount', { ascending: false })
        .limit(20);

      if (usersError) throw usersError;
      setTrendingUsers(users || []);

      // Fetch trending boltz
      const { data: boltz, error: boltzError } = await supabase
        .from('boltz')
        .select('id, content, mediaurl, likecount, createdat, profiles!boltzuseridfkey(id, username, fullname, avatarurl, isverified)')
        .order('likecount', { ascending: false })
        .limit(20);

      if (boltzError) throw boltzError;
      setTrendingBoltz(boltz || []);

      trackEvent?.('trending_data_loaded', { 
        timeframe, 
        category: categoryFilter,
        postsCount: posts?.length || 0,
        hashtagsCount: hashtags?.length || 0
      });
    } catch (err) {
      console.error('Error fetching trending data:', err);
      setError('Failed to load trending content. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, timeframe, categoryFilter]);

  // Initial fetch and refetch on timeframe change
  useEffect(() => {
    if (user) {
      fetchTrendingData();
    }
  }, [user, timeframe]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchTrendingData(true);
  }, [fetchTrendingData]);

  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    setCategoryFilter(category);
    trackEvent?.('trending_category_change', { category });
  }, []);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe) => {
    setTimeframe(newTimeframe);
    trackEvent?.('trending_timeframe_change', { timeframe: newTimeframe });
  }, []);

  // Filter content based on category
  const filteredContent = useMemo(() => {
    switch (categoryFilter) {
      case 'posts':
        return trendingPosts.filter(post => 
          post.mediatype !== 'boltz' && post.mediatype !== 'video'
        );
      case 'photos':
        return trendingPosts.filter(post => post.mediatype === 'image');
      case 'videos':
        return trendingPosts.filter(post => post.mediatype === 'video');
      case 'boltz':
        return trendingBoltz;
      case 'hashtags':
        return trendingHashtags;
      case 'people':
        return trendingUsers;
      case 'all':
      default:
        return {
          posts: trendingPosts.slice(0, 12),
          hashtags: trendingHashtags.slice(0, 10),
          users: trendingUsers.slice(0, 8),
          boltz: trendingBoltz.slice(0, 8)
        };
    }
  }, [categoryFilter, trendingPosts, trendingHashtags, trendingUsers, trendingBoltz]);

  // Handle hashtag click
  const handleHashtagClick = useCallback((hashtag) => {
    trackEvent?.('trending_hashtag_click', { hashtag: hashtag.tag });
    navigate(`/hashtag/${hashtag.tag}`);
  }, [navigate]);

  // Handle user click
  const handleUserClick = useCallback((userId) => {
    trackEvent?.('trending_user_click', { userId });
    navigate(`/profile/${userId}`);
  }, [navigate]);

  return (
    <ErrorBoundary>
      <motion.main 
        className="page page-trending"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="page-inner">
          {/* Header with refresh button */}
          <div className="trending-header">
            <div className="trending-title-section">
              <motion.h1 
                className="trending-title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                🔥 Trending
              </motion.h1>
              <motion.p 
                className="trending-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Discover what's hot right now
              </motion.p>
            </div>
            <motion.button
              className={`refresh-button${refreshing ? ' refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Refresh trending content"
            >
              <span className="refresh-icon" aria-hidden="true">
                {refreshing ? '⏳' : '🔄'}
              </span>
              <span className="refresh-text">Refresh</span>
            </motion.button>
          </div>

          {/* Timeframe filters */}
          <motion.div 
            className="timeframe-filters"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {TIMEFRAME_FILTERS.map((filter) => (
              <motion.button
                key={filter.id}
                className={`timeframe-filter${timeframe === filter.id ? ' active' : ''}`}
                onClick={() => handleTimeframeChange(filter.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={filter.label}
                aria-pressed={timeframe === filter.id}
              >
                <span className="filter-icon" aria-hidden="true">{filter.icon}</span>
                <span className="filter-label">{filter.label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Category filters */}
          <motion.div 
            className="category-filters-section"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="category-filters">
              {CATEGORY_FILTERS.map((filter) => (
                <motion.button
                  key={filter.id}
                  className={`category-filter${categoryFilter === filter.id ? ' active' : ''}`}
                  onClick={() => handleCategoryChange(filter.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={filter.label}
                  aria-pressed={categoryFilter === filter.id}
                >
                  <span className="filter-icon" aria-hidden="true">{filter.icon}</span>
                  <span className="filter-label">{filter.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div 
              className="trending-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={handleRefresh}>
                Try Again
              </button>
            </motion.div>
          )}

          {/* Content area */}
          <div className="trending-content">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  className="trending-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SkeletonLoader count={12} type="post" />
                </motion.div>
              ) : categoryFilter === 'all' ? (
                // Mixed layout for "All" category
                <motion.div
                  key="all-content"
                  className="trending-all-layout"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Trending Hashtags Section */}
                  {filteredContent.hashtags?.length > 0 && (
                    <section className="trending-section trending-hashtags-section">
                      <h2 className="section-title">
                        <span className="section-icon">#️⃣</span>
                        Trending Hashtags
                      </h2>
                      <div className="hashtags-list">
                        {filteredContent.hashtags.map((hashtag, index) => (
                          <motion.div
                            key={hashtag.id}
                            className="trending-hashtag-card"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleHashtagClick(hashtag)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="hashtag-rank">#{index + 1}</div>
                            <div className="hashtag-info">
                              <div className="hashtag-tag">#{hashtag.tag}</div>
                              <div className="hashtag-stats">
                                {hashtag.postcount?.toLocaleString() || 0} posts
                              </div>
                            </div>
                            <div className="hashtag-trending-score">
                              🔥 {(hashtag.trendingscore || 0).toFixed(1)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Trending Posts Section */}
                  {filteredContent.posts?.length > 0 && (
                    <section className="trending-section trending-posts-section">
                      <h2 className="section-title">
                        <span className="section-icon">🔥</span>
                        Trending Posts
                      </h2>
                      <div className="posts-grid">
                        {filteredContent.posts.map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <PostCard 
                              post={post} 
                              user={user} 
                              compact={true}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Trending Users Section */}
                  {filteredContent.users?.length > 0 && (
                    <section className="trending-section trending-users-section">
                      <h2 className="section-title">
                        <span className="section-icon">👥</span>
                        Trending People
                      </h2>
                      <div className="users-grid">
                        {filteredContent.users.map((trendingUser, index) => (
                          <motion.div
                            key={trendingUser.id}
                            className="trending-user-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleUserClick(trendingUser.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="user-avatar-wrapper">
                              <img
                                src={trendingUser.avatarurl || '/default-avatar.png'}
                                alt={trendingUser.username}
                                className="user-avatar"
                              />
                              {trendingUser.isverified && (
                                <span className="verified-badge" aria-label="Verified">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="user-info">
                              <div className="user-name">
                                {trendingUser.fullname || trendingUser.username}
                              </div>
                              <div className="user-username">@{trendingUser.username}</div>
                              {trendingUser.bio && (
                                <div className="user-bio">{trendingUser.bio}</div>
                              )}
                              <div className="user-stats">
                                {(trendingUser.followercount || 0).toLocaleString()} followers
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Trending Boltz Section */}
                  {filteredContent.boltz?.length > 0 && (
                    <section className="trending-section trending-boltz-section">
                      <h2 className="section-title">
                        <span className="section-icon">⚡</span>
                        Trending Boltz
                      </h2>
                      <div className="boltz-grid">
                        {filteredContent.boltz.map((boltz, index) => (
                          <motion.div
                            key={boltz.id}
                            className="trending-boltz-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => navigate(`/boltz/${boltz.id}`)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {boltz.mediaurl && (
                              <div className="boltz-media">
                                <img src={boltz.mediaurl} alt="Boltz content" />
                              </div>
                            )}
                            <div className="boltz-content">
                              <div className="boltz-author">
                                <img
                                  src={boltz.profiles?.avatarurl || '/default-avatar.png'}
                                  alt={boltz.profiles?.username}
                                  className="author-avatar"
                                />
                                <span className="author-username">
                                  @{boltz.profiles?.username}
                                </span>
                              </div>
                              <div className="boltz-text">{boltz.content}</div>
                              <div className="boltz-stats">
                                ❤️ {(boltz.likecount || 0).toLocaleString()}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                </motion.div>
              ) : categoryFilter === 'hashtags' ? (
                // Hashtags only view
                <motion.div
                  key="hashtags-content"
                  className="trending-single-category"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {filteredContent.length > 0 ? (
                    <div className="hashtags-list-full">
                      {filteredContent.map((hashtag, index) => (
                        <motion.div
                          key={hashtag.id}
                          className="trending-hashtag-card full"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleHashtagClick(hashtag)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="hashtag-rank">#{index + 1}</div>
                          <div className="hashtag-info">
                            <div className="hashtag-tag">#{hashtag.tag}</div>
                            <div className="hashtag-stats">
                              {hashtag.postcount?.toLocaleString() || 0} posts
                            </div>
                          </div>
                          <div className="hashtag-trending-score">
                            🔥 {(hashtag.trendingscore || 0).toFixed(1)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="🏷️"
                      title="No trending hashtags"
                      message="Check back later for trending hashtags!"
                    />
                  )}
                </motion.div>
              ) : categoryFilter === 'people' ? (
                // People only view
                <motion.div
                  key="people-content"
                  className="trending-single-category"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {filteredContent.length > 0 ? (
                    <div className="users-grid-full">
                      {filteredContent.map((trendingUser, index) => (
                        <motion.div
                          key={trendingUser.id}
                          className="trending-user-card full"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleUserClick(trendingUser.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="user-avatar-wrapper">
                            <img
                              src={trendingUser.avatarurl || '/default-avatar.png'}
                              alt={trendingUser.username}
                              className="user-avatar"
                            />
                            {trendingUser.isverified && (
                              <span className="verified-badge" aria-label="Verified">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="user-info">
                            <div className="user-name">
                              {trendingUser.fullname || trendingUser.username}
                            </div>
                            <div className="user-username">@{trendingUser.username}</div>
                            {trendingUser.bio && (
                              <div className="user-bio">{trendingUser.bio}</div>
                            )}
                            <div className="user-stats">
                              {(trendingUser.followercount || 0).toLocaleString()} followers
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="👥"
                      title="No trending people"
                      message="Check back later for trending users!"
                    />
                  )}
                </motion.div>
              ) : (
                // Posts/Photos/Videos/Boltz grid view
                <motion.div
                  key="grid-content"
                  className="trending-single-category"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {filteredContent.length > 0 ? (
                    <div className="posts-grid-full">
                      {filteredContent.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          {categoryFilter === 'boltz' ? (
                            <div
                              className="trending-boltz-card"
                              onClick={() => navigate(`/boltz/${item.id}`)}
                            >
                              {item.mediaurl && (
                                <div className="boltz-media">
                                  <img src={item.mediaurl} alt="Boltz content" />
                                </div>
                              )}
                              <div className="boltz-content">
                                <div className="boltz-author">
                                  <img
                                    src={item.profiles?.avatarurl || '/default-avatar.png'}
                                    alt={item.profiles?.username}
                                    className="author-avatar"
                                  />
                                  <span className="author-username">
                                    @{item.profiles?.username}
                                  </span>
                                </div>
                                <div className="boltz-text">{item.content}</div>
                                <div className="boltz-stats">
                                  ❤️ {(item.likecount || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <PostCard 
                              post={item} 
                              user={user} 
                              compact={true}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CATEGORY_FILTERS.find(f => f.id === categoryFilter)?.icon || '📝'}
                      title={`No trending ${categoryFilter}`}
                      message={`Check back later for trending ${categoryFilter}!`}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.main>
    </ErrorBoundary>
  );
}
