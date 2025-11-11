import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import searchService from '../utils/searchService';
import './SearchBar.css';

export default function SearchBar({ 
  value, 
  onChange, 
  onSearch, 
  loading = false, 
  placeholder = "Search...",
  user,
  showHistory = true
}) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load search history when focused
  useEffect(() => {
    if (focused && showHistory && user && !value) {
      loadSearchHistory();
    }
  }, [focused, user, value, showHistory]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (value.trim() && onSearch) {
        onSearch(value.trim());
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, onSearch]);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length >= 2) {
      setLoadingSuggestions(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const autocompleteSuggestions = await searchService.getAutocompleteSuggestions(value.trim(), 6);
          setSuggestions(autocompleteSuggestions);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 200);
    } else {
      setSuggestions([]);
      setLoadingSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const loadSearchHistory = async () => {
    if (!user) return;
    try {
      const history = await searchService.getSearchHistory(user.id, 5);
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSuggestionClick = async (suggestion) => {
    const searchText = suggestion.text || suggestion.query || suggestion;
    onChange(searchText);
    
    // Save to search history
    if (user) {
      await searchService.saveSearchHistory(user.id, searchText);
    }
    
    // Navigate based on suggestion type
    if (suggestion.type === 'user') {
      navigate(`/profile/${suggestion.text}`);
    } else if (suggestion.type === 'hashtag') {
      const tag = suggestion.text.replace(/^#/, '');
      navigate(`/hashtag/${tag}`);
    } else {
      // Trigger search
      if (onSearch) {
        onSearch(searchText);
      }
    }
    
    setSuggestions([]);
    setSearchHistory([]);
    setFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
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

  const handleDeleteHistoryItem = async (e, itemId) => {
    e.stopPropagation();
    try {
      await searchService.deleteSearchHistoryItem(itemId);
      setSearchHistory(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setFocused(false);
      setSuggestions([]);
      setSearchHistory([]);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && value.trim()) {
      // Save to history and trigger search
      if (user) {
        searchService.saveSearchHistory(user.id, value.trim());
      }
      if (onSearch) {
        onSearch(value.trim());
      }
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="search-bar-container">
      <motion.div 
        className={`search-bar ${focused ? 'focused' : ''}`}
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="search-icon">
          {loading ? (
            <div className="search-loading-spinner"></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21L16.65 16.65"/>
            </svg>
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search users, hashtags, and posts"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={focused && (suggestions.length > 0 || searchHistory.length > 0)}
          role="combobox"
        />
        
        {value && (
          <motion.button
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </motion.button>
        )}
      </motion.div>

      {/* Search Suggestions and History */}
      <AnimatePresence>
        {focused && (suggestions.length > 0 || searchHistory.length > 0) && (
          <motion.div
            id="search-suggestions"
            className="search-suggestions"
            role="listbox"
            aria-label="Search suggestions"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search History */}
            {!value && searchHistory.length > 0 && (
              <>
                <div className="suggestions-header">
                  <span className="suggestions-title">Recent</span>
                  <button 
                    className="clear-history-btn"
                    onClick={handleClearHistory}
                    aria-label="Clear all search history"
                  >
                    Clear all
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <motion.button
                    key={item.id}
                    className="suggestion-item history-item"
                    onClick={() => handleSuggestionClick(item)}
                    role="option"
                    aria-label={`Recent search: ${item.query}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span className="suggestion-text">{item.query}</span>
                    <button
                      className="delete-history-btn"
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      aria-label={`Remove ${item.query} from history`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </motion.button>
                ))}
              </>
            )}

            {/* Autocomplete Suggestions */}
            {value && suggestions.length > 0 && (
              <>
                {searchHistory.length > 0 && <div className="suggestions-divider" />}
                {loadingSuggestions ? (
                  <div className="suggestions-loading">
                    <div className="loading-spinner-small"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <motion.button
                      key={`${suggestion.type}-${suggestion.text}`}
                      className={`suggestion-item ${suggestion.type}-suggestion`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      role="option"
                      aria-label={`${suggestion.type === 'user' ? 'User' : suggestion.type === 'hashtag' ? 'Hashtag' : 'Search for'}: ${suggestion.text}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {suggestion.type === 'user' ? (
                        <>
                          {suggestion.icon ? (
                            <img 
                              src={suggestion.icon} 
                              alt={suggestion.text}
                              className="suggestion-avatar"
                            />
                          ) : (
                            <div className="suggestion-avatar-placeholder">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            </div>
                          )}
                          <span className="suggestion-text">
                            {suggestion.text}
                            {suggestion.verified && (
                              <svg className="verified-badge" width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            )}
                          </span>
                        </>
                      ) : suggestion.type === 'hashtag' ? (
                        <>
                          <div className="hashtag-icon">#</div>
                          <span className="suggestion-text">
                            {suggestion.text}
                            {suggestion.count && (
                              <span className="suggestion-count">
                                {suggestion.count.toLocaleString()} posts
                              </span>
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21L16.65 16.65"/>
                          </svg>
                          <span className="suggestion-text">{suggestion.text}</span>
                        </>
                      )}
                    </motion.button>
                  ))
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}