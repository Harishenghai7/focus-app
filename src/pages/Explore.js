"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import ExploreTabs from '../components/ExploreTabs';
import TrendingHashtags from '../components/TrendingHashtags';
import SuggestedUsers from '../components/SuggestedUsers';
import ExploreGrid from '../components/ExploreGrid';
import LoadingFallback from '../components/LoadingFallback';
import EmptyState from '../components/EmptyState';
import EndOfFeed from '../components/EndOfFeed';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useRealtimeExplore } from '../hooks/useRealtimeExplore';
import "./Explore.css";

const TABS = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'photos', label: 'Photos', icon: '🖼️' },
  { id: 'videos', label: 'Videos', icon: '📹' },
  { id: 'boltz', label: 'Boltz', icon: '⚡' },
  { id: 'flash', label: 'Flash', icon: '⚡' },
  { id: 'people', label: 'People', icon: '�' }
];

const PAGE_SIZE = 21; // 3x7 grid for perfect layout

export default function Explore({ user, userProfile }) {
  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [trendingTags, setTrendingTags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const scrollRef = useRef(null);
  const mounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Fetch trending hashtags
  const fetchTrendingHashtags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('postcount', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      if (mounted.current) {
        setTrendingTags(data || []);
      }
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
    }
  }, []);

  // Fetch suggested users
  const fetchSuggestedUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatarurl, fullname, isverified, followercount, bio')
        .neq('id', user.id)
        .order('followercount', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      if (mounted.current) {
        setSuggestedUsers(data || []);
      }
    } catch (err) {
      console.error('Error fetching suggested users:', err);
    }
  }, [user]);

  // Fetch explore content
  const fetchExploreContent = useCallback(async (reset = false) => {
    if (!user) return;

    const currentPage = reset ? 0 : page;
    const offset = currentPage * PAGE_SIZE;

    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      let query;
      const isPeopleTab = activeTab === 'people';

      if (isPeopleTab) {
        // Fetch users for People tab
        query = supabase
          .from('profiles')
          .select('id, username, avatarurl, fullname, isverified, followercount, bio')
          .neq('id', user.id);

        if (debouncedSearch) {
          query = query.or(`username.ilike.%${debouncedSearch}%,fullname.ilike.%${debouncedSearch}%`);
        }

        query = query
          .order('followercount', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        const { data, error } = await query;
        if (error) throw error;

        if (mounted.current) {
          if (reset) {
            setPeople(data || []);
          } else {
            setPeople(prev => [...prev, ...(data || [])]);
          }
          setHasMore(data && data.length === PAGE_SIZE);
        }
      } else {
        // Fetch posts for other tabs
        query = supabase
          .from('posts')
          .select(`
            *,
            profiles:userid (
              id,
              username,
              avatarurl,
              fullname,
              isverified
            )
          `);

        // Apply tab filters
        if (activeTab === 'photos') {
          query = query.eq('mediatype', 'image');
        } else if (activeTab === 'videos') {
          query = query.eq('mediatype', 'video');
        } else if (activeTab === 'boltz') {
          query = query.eq('posttype', 'boltz');
        } else if (activeTab === 'flash') {
          query = query.eq('posttype', 'flash');
        }

        // Apply search filter
        if (debouncedSearch) {
          query = query.or(`content.ilike.%${debouncedSearch}%,hashtags.cs.{${debouncedSearch}}`);
        }

        // Apply hashtag filter
        if (selectedHashtag) {
          query = query.contains('hashtags', [selectedHashtag]);
        }

        query = query
          .order('createdat', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        const { data, error } = await query;
        if (error) throw error;

        if (mounted.current) {
          if (reset) {
            setPosts(data || []);
          } else {
            setPosts(prev => [...prev, ...(data || [])]);
          }
          setHasMore(data && data.length === PAGE_SIZE);
        }
      }

      if (reset) {
        setPage(0);
      } else {
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Error fetching explore content:', err);
      if (mounted.current) {
        setError('Failed to load content. Please try again.');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [user, activeTab, debouncedSearch, selectedHashtag, page]);

  // Load more content for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchExploreContent(false);
    }
  }, [loadingMore, hasMore, loading, fetchExploreContent]);

  // Setup infinite scroll
  useInfiniteScroll(scrollRef, loadMore, {
    threshold: 300,
    enabled: hasMore && !loading && !loadingMore
  });

  // Real-time updates
  useRealtimeExplore((update) => {
    if (update.type === 'new_post' && activeTab !== 'people') {
      // Show banner or auto-refresh
      fetchExploreContent(true);
    }
  });

  // Initial load and reset on dependencies change
  useEffect(() => {
    fetchExploreContent(true);
  }, [activeTab, debouncedSearch, selectedHashtag]);

  // Load sidebar data
  useEffect(() => {
    if (user) {
      fetchTrendingHashtags();
      fetchSuggestedUsers();
    }
  }, [user, fetchTrendingHashtags, fetchSuggestedUsers]);

  // Handle tab change
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSelectedHashtag(null);
    setPage(0);
  }, []);

  // Handle hashtag click
  const handleHashtagClick = useCallback((tag) => {
    setSelectedHashtag(tag);
    setActiveTab('all');
    setPage(0);
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedHashtag(null);
    setSearchQuery('');
    setActiveTab('all');
  }, []);

  // Get display items based on active tab
  const displayItems = activeTab === 'people' ? people : posts;
  const isEmpty = !loading && displayItems.length === 0;

  return (
    <div className="explore-page">
      <Sidebar user={user} userProfile={userProfile} />
      
      <main className="explore-main-container" ref={scrollRef}>
        <div className="explore-content">
          {/* Search Bar */}
          <div className="explore-search-section">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search posts, people, hashtags..."
              user={user}
              showHistory={false}
            />
          </div>

          {/* Tabs */}
          <ExploreTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Trending Section (Hashtags + Suggested Users) */}
          <div className="explore-sidebar-section">
            <div className="explore-sidebar-row">
              {/* Trending Hashtags */}
              <TrendingHashtags
                hashtags={trendingTags}
                onHashtagClick={handleHashtagClick}
                selectedHashtag={selectedHashtag}
              />

              {/* Suggested Users */}
              {activeTab !== 'people' && (
                <SuggestedUsers
                  users={suggestedUsers}
                  currentUser={user}
                />
              )}
            </div>
          </div>

          {/* Active Filters Banner */}
          {(selectedHashtag || searchQuery) && (
            <motion.div
              className="explore-active-filters"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="active-filters-content">
                <span className="filters-label">Active filters:</span>
                {selectedHashtag && (
                  <span className="filter-tag">
                    #{selectedHashtag}
                    <button
                      className="filter-remove"
                      onClick={() => setSelectedHashtag(null)}
                      aria-label="Remove hashtag filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="filter-tag">
                    Search: "{searchQuery}"
                    <button
                      className="filter-remove"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  className="clear-all-filters"
                  onClick={handleClearFilters}
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          )}

          {/* Main Grid Content */}
          <div className="explore-grid-container">
            <AnimatePresence mode="wait">
              {loading ? (
                <LoadingFallback type="grid" count={PAGE_SIZE} />
              ) : error ? (
                <EmptyState
                  icon="❌"
                  title="Something went wrong"
                  message={error}
                  action={{
                    label: 'Try Again',
                    onClick: () => fetchExploreContent(true)
                  }}
                />
              ) : isEmpty ? (
                <EmptyState
                  icon={activeTab === 'people' ? '👥' : '🔍'}
                  title="No results found"
                  message={
                    searchQuery || selectedHashtag
                      ? 'Try adjusting your filters or search terms'
                      : 'Check back later for new content'
                  }
                  action={
                    (searchQuery || selectedHashtag) ? {
                      label: 'Clear Filters',
                      onClick: handleClearFilters
                    } : null
                  }
                />
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ExploreGrid
                    items={displayItems}
                    activeTab={activeTab}
                    user={user}
                  />

                  {/* Loading More Indicator */}
                  {loadingMore && (
                    <div className="explore-loading-more">
                      <div className="loading-spinner" />
                      <span>Loading more...</span>
                    </div>
                  )}

                  {/* End of Feed */}
                  {!hasMore && displayItems.length > 0 && (
                    <EndOfFeed message="You've seen all the posts!" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper: Personalized Recommendations (placeholder, can be implemented)
async function getPersonalizedRecommendations(userId, limit = 20) {
  if (!userId) return [];
  // Implementation example:
  // Combine followed users posts, liked hashtags trending posts, etc.
  // Return deduplicated, sorted by relevance or recency.
  return [];
}
