import React, { useState, useMemo } from 'react';
import styles from './StickerPicker.module.css';
import { STICKER_ASSETS, STICKER_CATEGORIES } from '../../utils/stickerAssets';
import { Search } from 'lucide-react';

const StickerPicker = ({ onSelect }) => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStickers = useMemo(() => {
        let stickers = STICKER_ASSETS;

        // Filter by category
        if (activeCategory !== 'all') {
            stickers = stickers.filter(s => s.category === activeCategory);
        }

        // Filter by search query
        if (searchQuery) {
            stickers = stickers.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return stickers;
    }, [activeCategory, searchQuery]);

    return (
        <div className={styles.container}>
            {/* Search Bar */}
            <div className={styles.searchBar}>
                <Search size={16} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search stickers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Category Tabs */}
            <div className={styles.categories}>
                {STICKER_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.active : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        <span className={styles.categoryIcon}>{cat.icon}</span>
                        <span className={styles.categoryName}>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Sticker Grid */}
            <div className={styles.grid}>
                {filteredStickers.length > 0 ? (
                    filteredStickers.map((sticker) => (
                        <button
                            key={sticker.id}
                            className={styles.stickerBtn}
                            onClick={() => onSelect(sticker.url)}
                            title={sticker.name}
                        >
                            <img src={sticker.url} alt={sticker.name} className={styles.stickerImg} />
                            <span className={styles.stickerName}>{sticker.name}</span>
                        </button>
                    ))
                ) : (
                    <div className={styles.noResults}>
                        <p>No stickers found</p>
                        <span>Try a different search or category</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StickerPicker;
