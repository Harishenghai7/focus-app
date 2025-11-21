import React, { useRef, useEffect, useState } from 'react';
import './SearchBar.css';

const SearchBar = ({
  value,
  onChange,
  onClear,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecent,
  onRemoveRecent,
  loading = false
}) => {
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowRecent(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (recentSearches.length > 0 && !value) {
      setShowRecent(true);
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    if (e.target.value) {
      setShowRecent(false);
    } else if (recentSearches.length > 0) {
      setShowRecent(true);
    }
  };

  const handleRecentClick = (search) => {
    onRecentSearchClick(search);
    setShowRecent(false);
    inputRef.current?.focus();
  };

  const handleRemoveRecent = (e, search) => {
    e.stopPropagation();
    onRemoveRecent(search);
  };

  const handleClearAll = () => {
    onClearRecent();
    setShowRecent(false);
  };

  const handleClear = () => {
    onClear();
    setShowRecent(false);
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className="search-bar">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search posts, people, or hashtags..."
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          aria-label="Search"
          aria-describedby="search-description"
          autoComplete="off"
        />
        
        <span id="search-description" className="sr-only">
          Search for posts, people, or hashtags on Focus
        </span>

        {loading && (
          <div className="search-loading" aria-label="Searching">
            <svg className="spinner-icon" width="20" height="20" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="60"
                strokeDashoffset="60"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
        )}

        {value && !loading && (
          <button
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {showRecent && recentSearches.length > 0 && (
        <div className="recent-searches-dropdown" role="listbox" aria-label="Recent searches">
          <div className="recent-header">
            <span className="recent-title">Recent</span>
            <button
              className="clear-all-button"
              onClick={handleClearAll}
              aria-label="Clear all recent searches"
              type="button"
            >
              Clear all
            </button>
          </div>
          
          <ul className="recent-list">
            {recentSearches.map((search, index) => (
              <li key={index} className="recent-item">
                <button
                  className="recent-item-button"
                  onClick={() => handleRecentClick(search)}
                  role="option"
                  aria-selected="false"
                >
                  <svg className="recent-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="recent-text">{search}</span>
                  <button
                    className="remove-recent-button"
                    onClick={(e) => handleRemoveRecent(e, search)}
                    aria-label={`Remove ${search} from recent searches`}
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 18L18 6M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
