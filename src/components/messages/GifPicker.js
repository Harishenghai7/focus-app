import React, { useState, useEffect } from 'react';
import styles from './GifPicker.module.css';

const TENOR_API_KEY = process.env.REACT_APP_TENOR_API_KEY;
const TENOR_API_URL = 'https://tenor.googleapis.com/v2';

const CATEGORIES = [
    { id: 'trending', name: 'Trending', searchTerm: '' },
    { id: 'happy', name: 'Happy', searchTerm: 'happy' },
    { id: 'sad', name: 'Sad', searchTerm: 'sad' },
    { id: 'excited', name: 'Excited', searchTerm: 'excited' },
    { id: 'love', name: 'Love', searchTerm: 'love' },
    { id: 'funny', name: 'Funny', searchTerm: 'funny' },
    { id: 'dance', name: 'Dance', searchTerm: 'dance' },
    { id: 'reaction', name: 'Reactions', searchTerm: 'reaction' }
];

const GifPicker = ({ onSelect, onClose }) => {
    const [gifs, setGifs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('trending');
    const [loading, setLoading] = useState(false);
    const [hoveredGif, setHoveredGif] = useState(null);

    const searchGifs = async (query) => {
        setLoading(true);
        try {
            const endpoint = query
                ? `${TENOR_API_URL}/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=20&media_filter=gif`
                : `${TENOR_API_URL}/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`;

            const response = await fetch(endpoint);
            const data = await response.json();

            setGifs(data.results || []);
        } catch (error) {
            console.error('Error fetching GIFs:', error);
            setGifs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const category = CATEGORIES.find(c => c.id === activeCategory);
        searchGifs(category?.searchTerm || '');
    }, [activeCategory]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            searchGifs(searchQuery);
            setActiveCategory('');
        }
    };

    const handleGifClick = (gif) => {
        const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
        if (gifUrl) {
            onSelect(gifUrl, gif.content_description || 'GIF');
            onClose();
        }
    };

    return (
        <div className={styles.gifPicker}>
            <div className={styles.header}>
                <h3 className={styles.title}>GIFs</h3>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
            </div>

            <form onSubmit={handleSearch} className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </form>

            <div className={styles.categories}>
                {CATEGORIES.map(category => (
                    <button
                        key={category.id}
                        className={`${styles.categoryBtn} ${activeCategory === category.id ? styles.active : ''}`}
                        onClick={() => {
                            setActiveCategory(category.id);
                            setSearchQuery('');
                        }}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className={styles.gifsContainer}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading GIFs...</p>
                    </div>
                ) : gifs.length > 0 ? (
                    <div className={styles.gifGrid}>
                        {gifs.map(gif => (
                            <div
                                key={gif.id}
                                className={styles.gifItem}
                                onClick={() => handleGifClick(gif)}
                                onMouseEnter={() => setHoveredGif(gif.id)}
                                onMouseLeave={() => setHoveredGif(null)}
                            >
                                <img
                                    src={hoveredGif === gif.id
                                        ? gif.media_formats?.gif?.url
                                        : gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url
                                    }
                                    alt={gif.content_description || 'GIF'}
                                    className={styles.gifImage}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>No GIFs found. Try searching!</p>
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <span className={styles.poweredBy}>Powered by Tenor</span>
            </div>
        </div>
    );
};

export default GifPicker;
