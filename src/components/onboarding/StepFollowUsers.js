import React, { useState, useEffect } from 'react';
import styles from './StepFollowUsers.module.css';
import SuggestedUserCard from './SuggestedUserCard';
import Button from '../shared/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { FaSearch, FaUserCheck } from 'react-icons/fa';

const CATEGORIES = [
    { id: 'creators', label: 'Creators' },
    { id: 'communities', label: 'Communities' },
    { id: 'trending', label: 'Trending' },
    { id: 'friends', label: 'Friends' },
];

const StepFollowUsers = ({ formData, updateFormData, onNext, onBack }) => {
    const { user } = useAuth();
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [activeCategory, setActiveCategory] = useState('creators');
    const followedUsers = formData.followedUsers || [];

    // Fetch suggested users on mount or category change
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!user) return;
            setLoading(true);

            try {
                // In a real app, this would use the category parameter.
                // Using fallback logic here for robustness during onboarding.
                const { data } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, bio, verified, followers_count')
                    .neq('id', user.id)
                    .order('followers_count', { ascending: false, nullsFirst: false })
                    .limit(12);

                setSuggestedUsers(data || []);
            } catch (error) {
                console.error('Fetch suggestions error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!searchQuery) fetchSuggestions();
    }, [user, activeCategory, searchQuery]);

    // Search users (debounced)
    useEffect(() => {
        if (!searchQuery.trim()) return;

        const searchUsers = setTimeout(async () => {
            setSearching(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, bio, verified, followers_count')
                    .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                    .neq('id', user.id)
                    .limit(8);

                if (error) throw error;
                setSuggestedUsers(data || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(searchUsers);
    }, [searchQuery, user?.id]);

    const handleFollow = (userId) => {
        if (followedUsers.includes(userId)) {
            updateFormData('followedUsers', followedUsers.filter(id => id !== userId));
        } else {
            updateFormData('followedUsers', [...followedUsers, userId]);
        }
    };

    const handleFollowAll = () => {
        const newIds = suggestedUsers
            .map(u => u.id)
            .filter(id => !followedUsers.includes(id));
        updateFormData('followedUsers', [...followedUsers, ...newIds]);
    };

    const minRequired = 5;
    const canContinue = followedUsers.length >= minRequired;

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <div className={styles.headerCopy}>
                    <h2 className={styles.title}>Find your people 👥</h2>
                    <p className={styles.subtitle}>A great feed starts with great people. Follow at least {minRequired} to continue.</p>
                </div>
                {suggestedUsers.length > 0 && !searchQuery && (
                    <button className={styles.followAllBtn} onClick={handleFollowAll}>
                        <FaUserCheck /> Follow All
                    </button>
                )}
            </div>

            {/* Search */}
            <div className={styles.searchContainer}>
                <div className={styles.searchBar}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search for friends, creators, or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searching && <span className={styles.searchSpinner} />}
                </div>

                {/* Category filters */}
                {!searchQuery && (
                    <div className={styles.categoryFilters}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`${styles.catPill} ${activeCategory === cat.id ? styles.catPillActive : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Follow Progress */}
            <div className={styles.followProgress}>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min((followedUsers.length / minRequired) * 100, 100)}%` }}
                    />
                </div>
                <div className={styles.progressText}>
                    <span>{followedUsers.length} followed</span>
                    <span>{followedUsers.length >= minRequired ? 'Goal reached!' : `${minRequired - followedUsers.length} more needed`}</span>
                </div>
            </div>

            {/* User Grid */}
            <div className={styles.grid}>
                {loading ? (
                    Array(6).fill(0).map((_, i) => <div key={i} className={styles.skeletonCard} />)
                ) : suggestedUsers.length === 0 ? (
                    <div className={styles.emptyState}>No users found matching "{searchQuery}"</div>
                ) : (
                    suggestedUsers.map(u => (
                        <SuggestedUserCard
                            key={u.id}
                            user={u}
                            isFollowing={followedUsers.includes(u.id)}
                            onFollow={() => handleFollow(u.id)}
                        />
                    ))
                )}
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button variant="primary" onClick={onNext} disabled={!canContinue}>
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default StepFollowUsers;
