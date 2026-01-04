// ═══════════════════════════════════════════════════════════════════════
// GIF PICKER COMPONENT - Tenor API Integration
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GifPicker.module.css';

// Tenor API Configuration
const TENOR_API_KEY = process.env.REACT_APP_TENOR_API_KEY || 'AIzaSyDGQQlpxKZJWbXqWdJqKGdJQdJQdJQdJQd'; // Replace with actual key
const TENOR_API_URL = 'https://tenor.googleapis.com/v2';

const GifPicker = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPos, setNextPos] = useState(null);
    const [activeTab, setActiveTab] = useState('trending');

    const scrollContainerRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Fetch GIFs from Tenor
    const fetchGifs = useCallback(async (query = '', pos = null) => {
        setLoading(true);
        try {
            const endpoint = query ? '/search' : '/featured';
            const params = new URLSearchParams({
                key: TENOR_API_KEY,
                client_key: 'focus-app',
                limit: '30',
                media_filter: 'gif,tinygif',
                ar_range: 'all'
            });

            if (query) {
                params.append('q', query);
            }
            if (pos) {
                params.append('pos', pos);
            }

            const response = await fetch(`${TENOR_API_URL}${endpoint}?${params}`);
            const data = await response.json();

            if (data.results) {
                setGifs(prev => pos ? [...prev, ...data.results] : data.results);
                setNextPos(data.next || null);
            }
        } catch (error) {
            console.error('Error fetching GIFs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load trending GIFs on mount
    useEffect(() => {
        fetchGifs('', null);
    }, [fetchGifs]);

    // Handle search with debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (searchQuery.trim()) {
                setActiveTab('search');
                fetchGifs(searchQuery, null);
            } else if (activeTab === 'search') {
                setActiveTab('trending');
                fetchGifs('', null);
            }
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, activeTab, fetchGifs]);

    // Infinite scroll
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || loading || !nextPos) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            fetchGifs(searchQuery || '', nextPos);
        }
    }, [loading, nextPos, searchQuery, fetchGifs]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    // Handle GIF selection
    const handleGifClick = (gif) => {
        const gifUrl = gif.media_formats?.gif?.url || gif.url;
        const previewUrl = gif.media_formats?.tinygif?.url || gifUrl;

        onSelect({
            url: gifUrl,
            previewUrl: previewUrl,
            width: gif.media_formats?.gif?.dims?.[0] || 400,
            height: gif.media_formats?.gif?.dims?.[1] || 300,
            title: gif.content_description || 'GIF'
        });
        onClose();
    };

    // Trending categories
    const trendingCategories = [
        'excited', 'love', 'happy', 'sad', 'angry', 'shocked',
        'laugh', 'cry', 'dance', 'celebrate', 'thumbs up', 'fire'
    ];

    const handleCategoryClick = (category) => {
        setSearchQuery(category);
        setActiveTab('search');
    };

    return (
        <div className={styles.gifPicker}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                        <line x1="7" y1="2" x2="7" y2="22" />
                        <line x1="17" y1="2" x2="17" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="2" y1="7" x2="7" y2="7" />
                        <line x1="2" y1="17" x2="7" y2="17" />
                        <line x1="17" y1="17" x2="22" y2="17" />
                        <line x1="17" y1="7" x2="22" y2="7" />
                    </svg>
                    GIFs
                </h3>
                <button className={styles.closeBtn} onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Search Bar */}
            <div className={styles.searchContainer}>
                <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    placeholder="Search for GIFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                    autoFocus
                />
                {searchQuery && (
                    <button
                        className={styles.clearBtn}
                        onClick={() => setSearchQuery('')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Trending Categories */}
            {!searchQuery && (
                <div className={styles.categories}>
                    {trendingCategories.map(category => (
                        <button
                            key={category}
                            className={styles.categoryChip}
                            onClick={() => handleCategoryClick(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {/* GIF Grid */}
            <div className={styles.gifsContainer} ref={scrollContainerRef}>
                {gifs.length > 0 ? (
                    <div className={styles.gifGrid}>
                        {gifs.map((gif, index) => (
                            <div
                                key={gif.id || index}
                                className={styles.gifItem}
                                onClick={() => handleGifClick(gif)}
                            >
                                <img
                                    src={gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url}
                                    alt={gif.content_description || 'GIF'}
                                    className={styles.gifImage}
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                ) : loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading GIFs...</p>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>No GIFs found</p>
                    </div>
                )}

                {loading && gifs.length > 0 && (
                    <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                    </div>
                )}
            </div>

            {/* Powered by Tenor */}
            <div className={styles.footer}>
                <span className={styles.poweredBy}>Powered by Tenor</span>
            </div>
        </div>
    );
};

export default GifPicker;
