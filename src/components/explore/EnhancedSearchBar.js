// EnhancedSearchBar - Pro-Grade Search with Suggestions
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import styles from './EnhancedSearchBar.module.css';

const EnhancedSearchBar = ({ onSearch, onFocus, onBlur }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [trendingSearches, setTrendingSearches] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Load recent and trending searches
    useEffect(() => {
        loadRecentSearches();
        loadTrendingSearches();
    }, []);

    const loadRecentSearches = () => {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        setRecentSearches(recent.slice(0, 5));
    };

    const loadTrendingSearches = () => {
        supabase
            .from('trending_hashtags_24h_v')
            .select('hashtag, post_count')
            .limit(5)
            .then(({ data }) => {
                setTrendingSearches((data || []).map((item) => ({
                    query: `#${item.hashtag}`,
                    count: item.post_count || 0
                })));
            })
            .catch(() => setTrendingSearches([]));
    };

    const saveToRecent = (searchQuery) => {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const updated = [searchQuery, ...recent.filter(q => q !== searchQuery)].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        setRecentSearches(updated.slice(0, 5));
    };

    const clearRecentSearches = () => {
        localStorage.removeItem('recentSearches');
        setRecentSearches([]);
    };

    const fetchSuggestions = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            return;
        }

        setLoading(true);

        try {
            const { data: users } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified, trust_tier')
                .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                .limit(8);

            const normalizedTag = searchQuery.startsWith('#') ? searchQuery.slice(1).toLowerCase() : searchQuery.toLowerCase();
            const { data: hashtags } = await supabase
                .from('trending_hashtags_24h_v')
                .select('hashtag, post_count')
                .ilike('hashtag', `%${normalizedTag}%`)
                .limit(5);

            setSuggestions({
                users: users || [],
                hashtags
            });
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Debounce search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    };

    const handleSearch = (searchQuery) => {
        if (!searchQuery.trim()) return;

        saveToRecent(searchQuery);
        setQuery(searchQuery);
        setShowSuggestions(false);

        if (onSearch) onSearch(searchQuery);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        }
    };

    const handleFocus = () => {
        setShowSuggestions(true);
        if (onFocus) onFocus();
    };

    const handleBlur = () => {
        // Delay to allow clicking suggestions
        setTimeout(() => {
            setShowSuggestions(false);
            if (onBlur) onBlur();
        }, 200);
    };

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
        setShowSuggestions(false);
    };

    const handleHashtagClick = (tag) => {
        handleSearch(tag);
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Search posts, people, or tags..."
                    className={styles.input}
                />
                {query && (
                    <button
                        className={styles.clearButton}
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                            inputRef.current?.focus();
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
                <div className={styles.suggestionsPanel}>
                    {loading ? (
                        <div className={styles.loading}>
                            <span className={styles.spinner}>⏳</span>
                            <span>Searching...</span>
                        </div>
                    ) : query ? (
                        <>
                            {/* User Suggestions */}
                            {suggestions.users?.length > 0 && (
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>People</div>
                                    {suggestions.users.map(user => (
                                        <div
                                            key={user.id}
                                            className={styles.suggestionItem}
                                            onClick={() => handleUserClick(user.username)}
                                        >
                                            <img
                                                src={user.avatar_url || '/default-avatar.png'}
                                                alt={user.username}
                                                className={styles.avatar}
                                            />
                                            <div className={styles.userInfo}>
                                                <div className={styles.username}>
                                                    {user.username}
                                                    {(user.is_verified || (user.trust_tier || 0) >= 4) && <span className={styles.verified}>✓</span>}
                                                </div>
                                                {user.full_name && (
                                                    <div className={styles.fullName}>{user.full_name}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Hashtag Suggestions */}
                            {suggestions.hashtags?.length > 0 && (
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Tags</div>
                                    {suggestions.hashtags.map((tag, idx) => (
                                        <div
                                            key={idx}
                                            className={styles.suggestionItem}
                                            onClick={() => handleHashtagClick(`#${tag.hashtag}`)}
                                        >
                                            <span className={styles.hashIcon}>#</span>
                                            <div className={styles.tagInfo}>
                                                <div className={styles.tagName}>{tag.hashtag}</div>
                                                <div className={styles.tagCount}>{tag.post_count} posts</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div className={styles.section}>
                                    <div className={styles.sectionHeader}>
                                        <div className={styles.sectionTitle}>Recent</div>
                                        <button
                                            className={styles.clearAll}
                                            onClick={clearRecentSearches}
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    {recentSearches.map((search, idx) => (
                                        <div
                                            key={idx}
                                            className={styles.suggestionItem}
                                            onClick={() => handleSearch(search)}
                                        >
                                            <span className={styles.recentIcon}>🕐</span>
                                            <span className={styles.recentText}>{search}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Trending Searches */}
                            {trendingSearches.length > 0 && (
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Trending</div>
                                    {trendingSearches.map((trend, idx) => (
                                        <div
                                            key={idx}
                                            className={styles.suggestionItem}
                                            onClick={() => handleSearch(trend.query)}
                                        >
                                            <span className={styles.trendIcon}>🔥</span>
                                            <div className={styles.trendInfo}>
                                                <div className={styles.trendQuery}>{trend.query}</div>
                                                <div className={styles.trendCount}>{trend.count.toLocaleString()} searches</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default EnhancedSearchBar;
