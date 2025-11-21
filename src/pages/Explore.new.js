import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

// Components
import SearchBar from '../components/SearchBar';
import BottomNav from '../components/BottomNav';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';

// Utils
import { trackPageView } from '../utils/analytics/trackPageView';
import { trackEvent } from '../utils/analytics/trackEvent';

import './Explore.css';

const CATEGORIES = ['All', 'Photos', 'Videos', 'Boltz', 'Reels'];
const PAGE_SIZE = 30;

function Explore() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [activeCategory, setActiveCategory] = useState('All');
  const [explorePosts, setExplorePosts] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Refs
  const observerRef = useRef();
  const lastItemRef = useRef();

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Track page view
  useEffect(() => {
    trackPageView('Explore');
  }, []);

  // Fetch explore content
  const fetchExploreContent = useCallback(async (category = 'All', pageNum = 0) => {
    try {
      setLoading(true);
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            verified
          ),
          post_likes (count),
          comments (count)
        `)
        .order('engagement_score', { ascending: false })
        .range(from, to);

      // Filter by category
      if (category === 'Photos') {
        query = query.eq('media_type', 'image');
      } else if (category === 'Videos') {
        query = query.eq('media_type', 'video');
      } else if (category === 'Boltz') {
        query = query.eq('post_type', 'boltz');
      } else if (category === 'Reels') {
        query = query.eq('post_type', 'reel');
      }

      const { data, error } = await query;

      if (error) throw error;

      if (pageNum === 0) {
        setExplorePosts(data || []);
      } else {
        setExplorePosts(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data && data.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching explore content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trending hashtags
  const fetchTrendingHashtags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trending_hashtags')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
    }
  }, []);

  // Fetch suggested users
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, verified, bio')
        .neq('id', user?.id)
        .order('followers_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSuggestedUsers(data || []);
    } catch (err) {
      console.error('Error fetching suggested users:', err);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchExploreContent('All', 0);
    fetchTrendingHashtags();
    fetchSuggestedUsers();
  }, []);

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    fetchExploreContent(category, 0);
    trackEvent('explore_category_changed', { category });
  };

  // Handle search
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults(null);
      return;
    }

    const performSearch = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              id,
              username,
              avatar_url,
              verified
            )
          `)
          .or(`caption.ilike.%${debouncedSearch}%,hashtags.cs.{${debouncedSearch}}`)
          .limit(30);

        if (error) throw error;
        setSearchResults(data || []);
        trackEvent('explore_search', { query: debouncedSearch });
      } catch (err) {
        console.error('Error searching:', err);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  // Infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchExploreContent(activeCategory, page + 1);
      }
    }, options);

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, page, activeCategory, fetchExploreContent]);

  // Handle tile click
  const handleTileClick = (post) => {
    navigate(`/post/${post.id}`);
    trackEvent('explore_post_clicked', { post_id: post.id });
  };

  // Handle hashtag click
  const handleHashtagClick = (hashtag) => {
    setSearchQuery(hashtag);
    trackEvent('trending_hashtag_clicked', { hashtag });
  };

  // Handle follow user
  const handleFollowUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;

      // Update local state
      setSuggestedUsers(prev =>
        prev.filter(u => u.id !== userId)
      );

      trackEvent('user_followed', { user_id: userId, source: 'explore' });
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const displayPosts = searchResults || explorePosts;

  return (
    <div className="page-explore">
      {/* Search Bar */}
      <div className="search-section">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search users, hashtags, places..."
        />
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map(category => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Trending Hashtags */}
      {!searchQuery && trendingHashtags.length > 0 && (
        <div className="trending-section">
          <div className="trending-header">
            <span className="trending-icon">🔥</span>
            <h3>Trending Now</h3>
          </div>
          <div className="hashtag-list">
            {trendingHashtags.map((hashtag, index) => (
              <motion.button
                key={hashtag.id}
                className="hashtag-pill"
                onClick={() => handleHashtagClick(hashtag.name)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                #{hashtag.name}
                <span className="hashtag-count">
                  {hashtag.post_count > 1000
                    ? `${(hashtag.post_count / 1000).toFixed(1)}K`
                    : hashtag.post_count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Explore Grid */}
      <div className="explore-grid">
        {loading && displayPosts.length === 0 ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="explore-tile-skeleton" />
          ))
        ) : displayPosts.length === 0 ? (
          <div className="empty-explore">
            <div className="empty-icon">🔍</div>
            <h3>No results found</h3>
            <p>Try different keywords</p>
          </div>
        ) : (
          displayPosts.map((post, index) => (
            <motion.div
              key={post.id}
              ref={index === displayPosts.length - 1 ? lastItemRef : null}
              className="explore-tile"
              onClick={() => handleTileClick(post)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <img
                src={post.media_url || post.thumbnail_url}
                alt={post.caption}
                loading="lazy"
              />
              {post.media_type === 'video' && (
                <div className="video-indicator">
                  <span className="play-icon">▶</span>
                </div>
              )}
              <div className="tile-overlay">
                <div className="tile-stats">
                  <span>
                    ❤️ {post.post_likes?.[0]?.count || 0}
                  </span>
                  <span>
                    💬 {post.comments?.[0]?.count || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Suggested Users */}
      {!searchQuery && suggestedUsers.length > 0 && (
        <div className="suggested-users-section">
          <h3>Suggested For You</h3>
          <div className="suggested-users-list">
            {suggestedUsers.map((user) => (
              <motion.div
                key={user.id}
                className="suggested-user-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={user.username}
                  className="user-avatar"
                />
                <div className="user-info">
                  <div className="username">
                    {user.username}
                    {user.verified && <span className="verified-badge">✓</span>}
                  </div>
                  <div className="user-bio">{user.bio}</div>
                </div>
                <button
                  className="follow-button"
                  onClick={() => handleFollowUser(user.id)}
                >
                  Follow
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav currentPage="explore" />
    </div>
  );
}

export default Explore;
