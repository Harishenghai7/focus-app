import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import styles from './SearchBar.module.css';
import { useSearch } from '../../hooks/useSearch';
import Avatar from '../ui/Avatar';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ placeholder = "Search" }) => {
    const navigate = useNavigate();
    const {
        query,
        setQuery,
        results,
        loading,
        history,
        addToHistory,
        removeFromHistory
    } = useSearch();

    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item, type) => {
        if (type === 'user') {
            addToHistory(item.username);
            navigate(`/profile/${item.username}`);
        } else if (type === 'hashtag') {
            addToHistory(`#${item.name}`);
            navigate(`/explore/tags/${item.name}`);
        } else if (type === 'history') {
            setQuery(item);
        }
        setIsFocused(false);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && query) {
            addToHistory(query);
            navigate(`/explore/search?q=${encodeURIComponent(query)}`);
            setIsFocused(false);
        }
    };

    return (
        <div className={styles.searchWrapper} ref={wrapperRef}>
            <div className={`${styles.inputContainer} ${isFocused ? styles.focused : ''}`}>
                <Search className={styles.searchIcon} size={18} />
                <input
                    type="text"
                    className={styles.input}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleSearchSubmit}
                    placeholder={placeholder}
                />
                {query && (
                    <button className={styles.clearButton} onClick={() => setQuery('')}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {isFocused && (
                <div className={styles.dropdown}>
                    {/* Recent History */}
                    {!query && history.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <span>Recent</span>
                                <button className={styles.clearAll} onClick={() => { }}>Clear all</button>
                            </div>
                            {history.map((term, idx) => (
                                <div key={idx} className={styles.historyItem} onClick={() => handleSelect(term, 'history')}>
                                    <Clock size={16} className={styles.historyIcon} />
                                    <span>{term}</span>
                                    <button
                                        className={styles.removeHistory}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromHistory(term);
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Results */}
                    {query && (
                        <div className={styles.results}>
                            {loading ? (
                                <div className={styles.loading}>Searching...</div>
                            ) : (
                                <>
                                    {results.users.length > 0 && (
                                        <div className={styles.section}>
                                            <div className={styles.sectionHeader}>Accounts</div>
                                            {results.users.map(user => (
                                                <div key={user.id} className={styles.resultItem} onClick={() => handleSelect(user, 'user')}>
                                                    <Avatar src={user.avatar_url} size="sm" />
                                                    <div className={styles.userInfo}>
                                                        <span className={styles.username}>{user.username}</span>
                                                        <span className={styles.fullname}>{user.full_name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {results.hashtags.length > 0 && (
                                        <div className={styles.section}>
                                            <div className={styles.sectionHeader}>Tags</div>
                                            {results.hashtags.map(tag => (
                                                <div key={tag.id} className={styles.resultItem} onClick={() => handleSelect(tag, 'hashtag')}>
                                                    <div className={styles.hashtagIcon}>#</div>
                                                    <div className={styles.tagInfo}>
                                                        <span className={styles.tagName}>#{tag.name}</span>
                                                        <span className={styles.tagCount}>{tag.count} posts</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {results.users.length === 0 && results.hashtags.length === 0 && (
                                        <div className={styles.noResults}>
                                            No results found for "{query}"
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
