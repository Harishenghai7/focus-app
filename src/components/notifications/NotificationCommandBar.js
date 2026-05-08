/**
 * NotificationCommandBar — Sovereign Ecosystem
 * Search, quick filters, focus mode toggle, batch actions
 */
import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun, Filter, X } from 'lucide-react';
import styles from './NotificationCommandBar.module.css';

const QUICK_FILTERS = [
    { id: 'unread', label: 'Unread', icon: '●' },
    { id: 'mentions', label: 'Mentions', icon: '@' },
    { id: 'verified', label: 'From Verified', icon: '🛡' },
    { id: 'media', label: 'With Media', icon: '🖼' },
];

const NotificationCommandBar = ({
    searchQuery,
    onSearchChange,
    quickFilters = [],
    onQuickFilterToggle,
    focusMode,
    onFocusModeToggle,
    quietMode,
    onQuietModeToggle,
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleSearchToggle = () => {
        if (isSearchOpen && searchQuery) {
            onSearchChange('');
        }
        setIsSearchOpen(!isSearchOpen);
    };

    return (
        <div className={styles.commandBar}>
            {/* Search Area */}
            <div className={`${styles.searchArea} ${isSearchOpen ? styles.searchOpen : ''}`}>
                {isSearchOpen ? (
                    <div className={styles.searchInputWrap}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            aria-label="Search notifications"
                        />
                        <button className={styles.searchClose} onClick={handleSearchToggle} aria-label="Close search">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button className={styles.searchBtn} onClick={handleSearchToggle} aria-label="Search notifications">
                        <Search size={16} />
                    </button>
                )}
            </div>

            {/* Quick Filters */}
            {!isSearchOpen && (
                <div className={styles.filters}>
                    {QUICK_FILTERS.map((f) => {
                        const isActive = quickFilters.includes(f.id);
                        return (
                            <button
                                key={f.id}
                                className={`${styles.filterChip} ${isActive ? styles.filterActive : ''}`}
                                onClick={() => onQuickFilterToggle(f.id)}
                                aria-pressed={isActive}
                            >
                                <span className={styles.filterIcon}>{f.icon}</span>
                                <span>{f.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Mode Toggles */}
            <div className={styles.modeToggles}>
                <button
                    className={`${styles.modeBtn} ${quietMode ? styles.modeActive : ''}`}
                    onClick={onQuietModeToggle}
                    title={quietMode ? 'Disable Quiet Mode' : 'Enable Quiet Mode'}
                    aria-label="Toggle quiet mode"
                >
                    <Filter size={15} />
                </button>
                <button
                    className={`${styles.modeBtn} ${styles.focusModeBtn} ${focusMode ? styles.modeActive : ''}`}
                    onClick={onFocusModeToggle}
                    title={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
                    aria-label="Toggle focus mode"
                >
                    {focusMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>
            </div>
        </div>
    );
};

export default NotificationCommandBar;
