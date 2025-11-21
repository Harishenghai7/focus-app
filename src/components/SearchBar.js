import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import searchService from '../utils/searchService';
import styles from './SearchBar.module.css';

/**
 * SearchBar - Search input with autocomplete and history.
 * @component
 * @param {string} value - Search value
 * @param {function} onChange - Handler for input change
 * @param {function} onSearch - Handler for search
 * @param {boolean} [loading] - Loading state
 * @param {string} [placeholder] - Input placeholder
 * @param {Object} user - Current user object
 * @param {boolean} [showHistory] - Show search history
 * @returns {React.ReactElement}
 */
const SearchBar = React.memo(function SearchBar({
  value,
  onChange,
  onSearch,
  loading = false,
  placeholder = 'Search...',
  user,
  showHistory = true,
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

  // Debounced onSearch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) onSearch?.(value.trim());
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onSearch]);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      setLoadingSuggestions(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const autocompleteSuggestions = await searchService.getAutocompleteSuggestions(
            value.trim(),
            6
          );
          setSuggestions(autocompleteSuggestions);
        } catch (error) {
          console.error('Error fetching suggestions', error);
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const loadSearchHistory = async () => {
    if (!user) return;
    try {
      const history = await searchService.getSearchHistory(user.id, 5);
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history', error);
    }
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = async (suggestion) => {
    const searchText = suggestion.text || suggestion.query || '';
    onChange(searchText);
    // Save to search history if user
    if (user) await searchService.saveSearchHistory(user.id, searchText);
    // Navigate on suggestion type
    if (suggestion.type === 'user') {
      navigate(`/profile/${suggestion.text}`);
    } else if (suggestion.type === 'hashtag') {
      const tag = suggestion.text.replace('#', '');
      navigate(`/hashtag/${tag}`);
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
      console.error('Error clearing search history', error);
    }
  };

  const handleDeleteHistoryItem = async (e, itemId) => {
    e.stopPropagation();
    try {
      await searchService.deleteSearchHistoryItem(itemId);
      setSearchHistory((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting search history item', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setFocused(false);
      setSuggestions([]);
      setSearchHistory([]);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      const trimmed = value.trim();
      if (trimmed) {
        if (user) searchService.saveSearchHistory(user.id, trimmed);
        onSearch?.(trimmed);
      }
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={styles['search-bar-container']}>
      <motion.div
        className={`${styles['search-bar']} ${focused ? styles['focused'] : ''}`}
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles['search-icon']}>
          {loading ? (
            <div className={styles['search-loading-spinner']} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21L16.65 16.65" />
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
          className={styles['search-input']}
          aria-label="Search users, hashtags, and posts"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={focused && (suggestions.length > 0 || searchHistory.length > 0)}
          role="combobox"
        />
        {value && (
          <motion.button
            className={styles['search-clear']}
            onClick={handleClear}
            aria-label="Clear search"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {focused && (suggestions.length > 0 || (showHistory && searchHistory.length > 0)) && (
          <motion.div
            id="search-suggestions"
            className={styles['search-suggestions']}
            role="listbox"
            aria-label="Search suggestions"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search History */}
            {showHistory && !value && searchHistory.length > 0 && (
              <>
                <div className={styles['suggestions-header']}>
                  <span className={styles['suggestions-title']}>Recent</span>
                  <button className={styles['clear-history-btn']} onClick={handleClearHistory} aria-label="Clear all search history">
                    Clear all
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <motion.button
                    key={item.id}
                    className={`${styles['suggestion-item']} ${styles['history-item']}`}
                    onClick={() => handleSuggestionClick(item)}
                    role="option"
                    aria-label={`Recent search ${item.query}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className={styles['suggestion-text']}>{item.query}</span>
                    <button
                      className={styles['delete-history-btn']}
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      aria-label={`Remove ${item.query} from history`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </motion.button>
                ))}
              </>
            )}

            {/* Suggestions */}
            {value && (
              <>
                {loadingSuggestions && (
                  <div className={styles['suggestions-loading']}>
                    <div className={styles['loading-spinner-small']} />
                    <span>Searching...</span>
                  </div>
                )}
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={`${suggestion.type}-${suggestion.text || suggestion.query}-${index}`}
                    className={`${styles['suggestion-item']} ${styles[`${suggestion.type}-suggestion`]}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    role="option"
                    aria-label={`${suggestion.type} suggestion ${suggestion.text || suggestion.query}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {suggestion.type === 'user' && suggestion.icon ? (
                      <img src={suggestion.icon} alt={suggestion.text} className={styles['suggestion-avatar']} />
                    ) : suggestion.type === 'user' ? (
                      <div className={styles['suggestion-avatar-placeholder']}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    ) : suggestion.type === 'hashtag' ? (
                      <div className={styles['hashtag-icon']}>#</div>
                    ) : null}
                    <span className={styles['suggestion-text']}>{suggestion.text || suggestion.query}</span>
                    {suggestion.verified && (
                      <svg
                        className={styles['verified-badge']}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#3b82f6"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                    {suggestion.type === 'hashtag' && (
                      <div className={styles['suggestion-count']}>{suggestion.count}</div>
                    )}
                  </motion.button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  loading: PropTypes.bool,
  placeholder: PropTypes.string,
  user: PropTypes.object,
  showHistory: PropTypes.bool
};

export default SearchBar;
