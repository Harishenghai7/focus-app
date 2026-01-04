// src/pages/Explore.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Image, Video, Zap, Users, Hash, Grid } from 'lucide-react';

import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { useRealtimeExplore } from '../hooks/useRealtimeExplore'; // Ensure this hook exists or remove if optional

// Components
import SearchBar from '../components/SearchBar';
import ExploreTabs from '../components/ExploreTabs';
import TrendingHashtags from '../components/TrendingHashtags';
import SuggestedUsers from '../components/SuggestedUsers';
import ExploreGrid from '../components/ExploreGrid';
import LoadingFallback from '../components/LoadingFallback';
import EmptyState from '../components/EmptyState';
import EndOfFeed from '../components/EndOfFeed';
import ErrorBanner from '../components/ErrorBanner';

import "./Explore.css";

const TABS = [
  { id: 'all', label: 'All', icon: <Grid size={18} /> },
  { id: 'photos', label: 'Photos', icon: <Image size={18} /> },
  { id: 'videos', label: 'Videos', icon: <Video size={18} /> },
  { id: 'boltz', label: 'Boltz', icon: <Zap size={18} /> },
  { id: 'people', label: 'People', icon: <Users size={18} /> }
];

const PAGE_SIZE = 21; // 3x7 grid optimized

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Explore({ userProfile }) {
  const { user } = useAuth();
  
  // State
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

  const debouncedSearch = useDebounce(searchQuery, 500);
  const scrollRef = useRef(null);
  const mounted = useRef(true);

  // Cleanup
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ========== DATA FETCHING: SIDEBAR ==========
  const fetchSidebarData = useCallback(async () => {
    if (!user) return;
    try {
      // Parallel fetch for speed
      const [tagsRes, usersRes] = await Promise.all([
        supabase.from('hashtags').select('*').order('post_count', { ascending: false }).limit(5),
        supabase.from('profiles').select('id, username, avatar_url, full_name, verified').neq('id', user.id).limit(5)
      ]);

      if (mounted.current) {
        if (tagsRes.data) setTrendingTags(tagsRes.data);
        // In a real app, we'd use a recommendation algorithm RPC for suggested users
        if (usersRes.data) setSuggestedUsers(usersRes.data);
      }
    } catch (err) {
      console.warn('Sidebar data fetch warning:', err);
    }
  }, [user]);

  // Page ref to avoid stale closures
  const pageRef = useRef(0);

  // ========== DATA FETCHING: MAIN CONTENT ==========
  const fetchExploreContent = useCallback(async (reset = false) => {
    if (!user) return;

    const currentPage = reset ? 0 : pageRef.current;
    const offset = currentPage * PAGE_SIZE;

    if (reset) {
      setLoading(true);
      setError(null);
      pageRef.current = 0;
      setPage(0);
      setPosts([]);
      setPeople([]);
    } else {
      setLoadingMore(true);
    }

    try {
      let data = [];
      let count = 0;

      if (activeTab === 'people') {
        // --- FETCH PEOPLE ---
        let query = supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name, verified, bio', { count: 'exact' })
          .neq('id', user.id);

        if (debouncedSearch) {
          query = query.or(`username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`);
        }

        const res = await query.range(offset, offset + PAGE_SIZE - 1);
        data = res.data;
        count = res.count; // Unused locally but good for debugging

      } else {
        // --- FETCH POSTS ---
        let query = supabase
          .from('posts')
          .select(`
            *,
            users:user_id (id, username, avatar_url, verified),
            post_likes(count),
            comments(count)
          `)
          .order('created_at', { ascending: false });

        // Filters
        if (activeTab === 'photos') query = query.eq('media_type', 'image');
        if (activeTab === 'videos') query = query.eq('media_type', 'video');
        if (activeTab === 'boltz') query = query.eq('is_boltz', true);

        // Search
        if (debouncedSearch) {
          query = query.textSearch('caption', debouncedSearch);
        }

        // Hashtag
        if (selectedHashtag) {
          query = query.contains('hashtags', [selectedHashtag]);
        }

        const res = await query.range(offset, offset + PAGE_SIZE - 1);
        data = res.data;
      }

      if (!mounted.current) return;

      // Update State
      if (activeTab === 'people') {
        setPeople(prev => reset ? (data || []) : [...prev, ...(data || [])]);
      } else {
        setPosts(prev => reset ? (data || []) : [...prev, ...(data || [])]);
      }

      setHasMore(data && data.length === PAGE_SIZE);
      if (!reset) {
        pageRef.current = currentPage + 1;
        setPage(currentPage + 1);
      }

    } catch (err) {
      console.error('Explore fetch error:', err);
      if (mounted.current) setError('Could not load content.');
    } finally {
      if (mounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [user, activeTab, debouncedSearch, selectedHashtag]);

  // Initial Effects
  useEffect(() => {
    fetchExploreContent(true);
  }, [activeTab, debouncedSearch, selectedHashtag]);

  useEffect(() => {
    fetchSidebarData();
  }, [fetchSidebarData]);

  // Handlers
  const handleTabChange = (id) => {
    setActiveTab(id);
    setPosts([]);
    setPeople([]);
    setPage(0);
    pageRef.current = 0;
  };

  const displayItems = activeTab === 'people' ? people : posts;
  const isEmpty = !loading && displayItems.length === 0;

  return (
    <div className="explore-page" ref={scrollRef}>
      <div className="explore-container">
        
        {/* 👈 LEFT COLUMN: CONTENT */}
        <div className="explore-main">
          
          {/* Search & Tabs Header */}
          <header className="explore-header glass-panel">
            <div className="search-wrapper">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search Focus..."
                isGlass
              />
            </div>
            <ExploreTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </header>

          {/* Active Filter Chips */}
          <AnimatePresence>
            {selectedHashtag && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="filter-chip-container"
              >
                <div className="filter-chip">
                  <Hash size={14} />
                  <span>{selectedHashtag}</span>
                  <button onClick={() => setSelectedHashtag(null)}>×</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid Content */}
          <div className="explore-grid-wrapper">
            {loading && page === 0 ? (
               <LoadingFallback type="grid" />
            ) : error ? (
               <ErrorBanner message={error} onRetry={() => fetchExploreContent(true)} />
            ) : isEmpty ? (
               <EmptyState 
                 icon={activeTab === 'people' ? <Users size={48} /> : <Search size={48} />}
                 title={activeTab === 'people' ? "No people found" : "No results found"}
                 message="Try adjusting your search or filters"
               />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <ExploreGrid 
                  items={displayItems} 
                  type={activeTab} 
                  variants={itemVariants} // Pass animation down
                />
                
                {loadingMore && (
                  <div className="loading-more-spinner">
                    <div className="spinner" />
                  </div>
                )}
                
                {!hasMore && <EndOfFeed />}
              </motion.div>
            )}
          </div>
        </div>

        {/* 👉 RIGHT COLUMN: SIDEBAR (Desktop Only) */}
        <aside className="explore-sidebar">
          <div className="sticky-sidebar-content">
            {/* Trending */}
            {trendingTags.length > 0 && (
              <div className="sidebar-section glass-panel">
                <h3 className="sidebar-title">Trending on Focus</h3>
                <TrendingHashtags 
                  tags={trendingTags} 
                  onTagClick={(tag) => {
                    setSelectedHashtag(tag);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                />
              </div>
            )}

            {/* Suggested People */}
            {suggestedUsers.length > 0 && (
              <div className="sidebar-section glass-panel">
                <h3 className="sidebar-title">Suggested for you</h3>
                <SuggestedUsers users={suggestedUsers} />
              </div>
            )}

            {/* Footer Links */}
            <footer className="sidebar-footer">
              <span>© 2025 Focus</span>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </footer>
          </div>
        </aside>

      </div>
    </div>
  );
}