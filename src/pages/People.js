import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import SuggestedUsers from '../components/SuggestedUsers';
import { FiRefreshCw, FiFilter, FiSearch, FiUser, FiUserPlus, FiTrendingUp } from 'react-icons/fi';
import './People.css';

/**
 * People.js - Discover new people
 * Features:
 * - Discover new people
 * - Suggested users based on activity
 * - Follow button
 * - Filter by category
 * - Refresh suggestions
 */
export default function People({ user }) {
  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingIds, setFollowingIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('followers'); // 'followers', 'recent', 'active'

  const categories = [
    { id: 'all', label: 'All', icon: FiUser },
    { id: 'popular', label: 'Popular', icon: FiTrendingUp },
    { id: 'new', label: 'New Users', icon: FiUserPlus },
  ];

  useEffect(() => {
    fetchSuggestedUsers();
  }, [user, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [suggestedUsers, activeCategory, searchQuery]);

  const fetchSuggestedUsers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get users that the current user is already following
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      const followingIdsList = followingData?.map(f => f.following_id) || [];
      setFollowingIds(new Set(followingIdsList));

      // Build query to get suggested users
      let query = supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          bio,
          followers_count,
          following_count,
          posts_count,
          created_at
        `)
        .neq('id', user.id);

      // Exclude followed users if any exist
      if (followingIdsList.length > 0) {
        query = query.not('id', 'in', `(${followingIdsList.join(',')})`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'followers':
          query = query.order('followers_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'active':
          query = query.order('posts_count', { ascending: false });
          break;
        default:
          query = query.order('followers_count', { ascending: false });
      }

      const { data: users, error } = await query.limit(50);

      if (error) throw error;

      setSuggestedUsers(users || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...suggestedUsers];

    // Apply category filter
    switch (activeCategory) {
      case 'popular':
        filtered = filtered.filter(user => user.followers_count >= 10);
        break;
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(user => new Date(user.created_at) >= thirtyDaysAgo);
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.bio?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSuggestedUsers();
    setRefreshing(false);
  };

  const handleFollowUser = async (userId) => {
    try {
      // Check if user is private
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', userId)
        .single();

      const isPrivate = profileData?.is_private || false;
      const status = isPrivate ? 'pending' : 'accepted';

      // Insert follow relationship
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: user.id,
        type: isPrivate ? 'follow_request' : 'follow',
        reference_id: user.id,
        created_at: new Date().toISOString()
      });

      // Update local state
      setFollowingIds(prev => new Set([...prev, userId]));

      // Remove from suggested users
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleViewProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  if (!user) {
    return (
      <Layout layoutType="feed">
        <div className="people-page">
          <div className="people-empty">
            <FiUser size={48} />
            <p>Please log in to discover people</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout layoutType="feed">
      <div className="people-page">
        {/* Header */}
        <div className="people-header">
          <div className="people-header-top">
            <h1>Discover People</h1>
            <button
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh suggestions"
            >
              <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="people-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Categories */}
          <div className="people-categories">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <Icon size={18} />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter & Sort */}
          <div className="people-controls">
            <button
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter size={18} />
              <span>Sort</span>
            </button>
          </div>

          {/* Sort Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="sort-options"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <label className="sort-option">
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === 'followers'}
                    onChange={() => setSortBy('followers')}
                  />
                  <span>Most Popular</span>
                </label>
                <label className="sort-option">
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === 'active'}
                    onChange={() => setSortBy('active')}
                  />
                  <span>Most Active</span>
                </label>
                <label className="sort-option">
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === 'recent'}
                    onChange={() => setSortBy('recent')}
                  />
                  <span>Recently Joined</span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="people-loading">
            <div className="spinner" />
            <p>Finding people for you...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="people-empty">
            <FiUser size={48} />
            <p>No people found</p>
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <motion.div
            className="people-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredUsers.map((suggestedUser, index) => (
              <motion.div
                key={suggestedUser.id}
                className="person-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className="person-avatar-wrapper"
                  onClick={() => handleViewProfile(suggestedUser.username)}
                >
                  <img
                    src={suggestedUser.avatar_url || '/default-avatar.png'}
                    alt={suggestedUser.username}
                    className="person-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                </div>

                <div className="person-info">
                  <div
                    className="person-names"
                    onClick={() => handleViewProfile(suggestedUser.username)}
                  >
                    <h3 className="person-username">@{suggestedUser.username}</h3>
                    {suggestedUser.full_name && (
                      <p className="person-fullname">{suggestedUser.full_name}</p>
                    )}
                  </div>

                  {suggestedUser.bio && (
                    <p className="person-bio">{suggestedUser.bio}</p>
                  )}

                  <div className="person-stats">
                    <span className="stat">
                      <strong>{suggestedUser.followers_count || 0}</strong> followers
                    </span>
                    <span className="stat-dot">•</span>
                    <span className="stat">
                      <strong>{suggestedUser.posts_count || 0}</strong> posts
                    </span>
                  </div>
                </div>

                <button
                  className="follow-btn"
                  onClick={() => handleFollowUser(suggestedUser.id)}
                  aria-label={`Follow ${suggestedUser.username}`}
                >
                  <FiUserPlus size={18} />
                  <span>Follow</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Sidebar with SuggestedUsers component */}
        <aside className="people-sidebar">
          <SuggestedUsers
            currentUser={user}
            onFollowUser={handleFollowUser}
            onViewProfile={handleViewProfile}
          />
        </aside>
      </div>
    </Layout>
  );
}
