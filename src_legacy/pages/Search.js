import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '../hooks/useDebounce';
import searchService from '../utils/searchService';
import SearchBar from '../components/SearchBar';
import SearchResultCard from '../components/SearchResultCard';
import { supabase } from '../supabaseClient';
import './Search.css';

const TABS = [
  { id: 'all', label: 'All', icon: '🔍' },
  { id: 'users', label: 'Users', icon: '👤' },
  { id: 'posts', label: 'Posts', icon: '📷' },
  { id: 'hashtags', label: 'Hashtags', icon: '#' }
];

/**
 * Search/UserSearch - Comprehensive search functionality
 * Features:
 * - Global search bar with autocomplete
 * - Recent searches
 * - Trending searches
 * - Results tabs (Users, Posts, Hashtags)
 * - Clear search history
 * - Search suggestions
 */
export default function Search({ user, userProfile }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  // State
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  
  const debouncedQuery = useDebounce(query, 300);
  const searchInputRef = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Load search history and trending searches on mount
  useEffect(() => {
    if (user) {
      loadSearchHistory();
      loadTrendingSearches();
    }
  }, [user]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery, activeTab);
      setShowSuggestions(false);
    } else if (debouncedQuery.trim().length === 0) {
      setResults({ users: [], posts: [], hashtags: [] });
      setShowSuggestions(false);
    }
  }, [debouncedQuery, activeTab]);

  // Get autocomplete suggestions
  useEffect(() => {
    if (query.trim().length >= 2 && query === debouncedQuery) {
      loadSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, debouncedQuery]);

  // Update URL with query parameter
  useEffect(() => {
    if (query.trim()) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const loadSearchHistory = async () => {
    try {
      const history = await searchService.getSearchHistory(user.id, 10);
      if (mounted.current) {
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      // Get trending hashtags as trending searches
      const { data, error } = await supabase
        .from('hashtags')
        .select('tag, postcount, trendingscore')
        .order('trendingscore', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (mounted.current) {
        setTrendingSearches(data || []);
      }
    } catch (error) {
      console.error('Error loading trending searches:', error);
    }
  };

  const loadSuggestions = async (searchQuery) => {
    try {
      const suggestions = await searchService.getAutocompleteSuggestions(searchQuery, 6);
      if (mounted.current) {
        setSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const performSearch = async (searchQuery, type = 'all') => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchService.search(searchQuery, type, 20);
      
      if (mounted.current) {
        setResults(searchResults);
        
        // Save to search history
        if (user) {
          await searchService.saveSearchHistory(user.id, searchQuery);
          await loadSearchHistory();
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      if (mounted.current) {
        setError('Failed to perform search. Please try again.');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
  };

  const handleSearchSubmit = () => {
    if (query.trim().length >= 2) {
      performSearch(query, activeTab);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    performSearch(suggestion.text, activeTab);
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem.query);
    performSearch(historyItem.query, activeTab);
  };

  const handleTrendingClick = (trending) => {
    const searchText = `#${trending.tag}`;
    setQuery(searchText);
    performSearch(searchText, activeTab);
  };

  const handleClearHistory = async () => {
    if (!user) return;
    
    try {
      await searchService.clearSearchHistory(user.id);
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const handleDeleteHistoryItem = async (itemId, event) => {
    event.stopPropagation();
    
    try {
      await searchService.deleteSearchHistoryItem(itemId);
      setSearchHistory(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting search history item:', error);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (query.trim()) {
      performSearch(query, tabId);
    }
  };

  const handleResultClick = (result) => {
    if (result.resulttype === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (result.resulttype === 'post') {
      navigate(`/post/${result.id}`);
    } else if (result.resulttype === 'hashtag') {
      navigate(`/explore?tag=${result.tag}`);
    }
  };

  const getFilteredResults = () => {
    if (activeTab === 'all') {
      return {
        users: results.users.slice(0, 5),
        posts: results.posts.slice(0, 6),
        hashtags: results.hashtags.slice(0, 5)
      };
    }
    return results;
  };

  const filteredResults = getFilteredResults();
  const hasResults = filteredResults.users.length > 0 || 
                     filteredResults.posts.length > 0 || 
                     filteredResults.hashtags.length > 0;
  const showEmptyState = !loading && query.trim() && !hasResults;
  const showInitialState = !query.trim() && !loading;

  return (
    <div className="search-page">
      {/* Search Header */}
      <div className="search-header">
        <div className="search-header-content">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <SearchBar
            ref={searchInputRef}
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleSearchSubmit}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            onSuggestionClick={handleSuggestionClick}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search users, posts, hashtags..."
            autoFocus
          />
        </div>

        {/* Tabs */}
        {query.trim() && (
          <div className="search-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`search-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Content */}
      <div className="search-content">
        {error && (
          <div className="search-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="search-loading">
            <div className="spinner" />
            <p>Searching...</p>
          </div>
        )}

        {/* Initial State - Show Recent & Trending */}
        {showInitialState && (
          <div className="search-initial">
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <h3>Recent Searches</h3>
                  <button 
                    className="clear-button"
                    onClick={handleClearHistory}
                  >
                    Clear All
                  </button>
                </div>
                <div className="history-list">
                  {searchHistory.map(item => (
                    <motion.div
                      key={item.id}
                      className="history-item"
                      onClick={() => handleHistoryClick(item)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <svg className="history-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="history-query">{item.query}</span>
                      <button
                        className="delete-button"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        aria-label="Remove"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            {trendingSearches.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <h3>Trending Searches</h3>
                </div>
                <div className="trending-list">
                  {trendingSearches.map((trending, index) => (
                    <motion.div
                      key={trending.tag}
                      className="trending-item"
                      onClick={() => handleTrendingClick(trending)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="trending-icon">🔥</div>
                      <div className="trending-info">
                        <span className="trending-tag">#{trending.tag}</span>
                        <span className="trending-count">
                          {trending.postcount.toLocaleString()} posts
                        </span>
                      </div>
                      <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {!loading && hasResults && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Users Results */}
              {(activeTab === 'all' || activeTab === 'users') && filteredResults.users.length > 0 && (
                <div className="results-section">
                  <h3 className="results-heading">
                    Users ({results.users.length})
                  </h3>
                  <div className="results-grid users-grid">
                    {filteredResults.users.map(user => (
                      <SearchResultCard
                        key={user.id}
                        result={user}
                        type="user"
                        onClick={() => handleResultClick(user)}
                      />
                    ))}
                  </div>
                  {activeTab === 'all' && results.users.length > 5 && (
                    <button
                      className="see-all-button"
                      onClick={() => setActiveTab('users')}
                    >
                      See all {results.users.length} users
                    </button>
                  )}
                </div>
              )}

              {/* Posts Results */}
              {(activeTab === 'all' || activeTab === 'posts') && filteredResults.posts.length > 0 && (
                <div className="results-section">
                  <h3 className="results-heading">
                    Posts ({results.posts.length})
                  </h3>
                  <div className="results-grid posts-grid">
                    {filteredResults.posts.map(post => (
                      <SearchResultCard
                        key={post.id}
                        result={post}
                        type="post"
                        onClick={() => handleResultClick(post)}
                      />
                    ))}
                  </div>
                  {activeTab === 'all' && results.posts.length > 6 && (
                    <button
                      className="see-all-button"
                      onClick={() => setActiveTab('posts')}
                    >
                      See all {results.posts.length} posts
                    </button>
                  )}
                </div>
              )}

              {/* Hashtags Results */}
              {(activeTab === 'all' || activeTab === 'hashtags') && filteredResults.hashtags.length > 0 && (
                <div className="results-section">
                  <h3 className="results-heading">
                    Hashtags ({results.hashtags.length})
                  </h3>
                  <div className="results-grid hashtags-grid">
                    {filteredResults.hashtags.map(hashtag => (
                      <SearchResultCard
                        key={hashtag.id}
                        result={hashtag}
                        type="hashtag"
                        onClick={() => handleResultClick(hashtag)}
                      />
                    ))}
                  </div>
                  {activeTab === 'all' && results.hashtags.length > 5 && (
                    <button
                      className="see-all-button"
                      onClick={() => setActiveTab('hashtags')}
                    >
                      See all {results.hashtags.length} hashtags
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <div className="search-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3>No results found</h3>
            <p>Try searching for something else</p>
          </div>
        )}
      </div>
    </div>
  );
}
