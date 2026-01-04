import React, { useState, useEffect } from 'react';
import styles from './StepFollowUsers.module.css';
import SuggestedUserCard from './SuggestedUserCard';
import Button from '../shared/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const StepFollowUsers = ({ formData, updateFormData, onNext, onBack }) => {
    const { user } = useAuth();
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const followedUsers = formData.followedUsers || [];

    // Fetch suggested users on mount
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const { data, error } = await supabase
                    .rpc('get_suggested_users', {
                        current_user_id: user.id,
                        limit_count: 20
                    });

                if (error) {
                    console.error('Error fetching suggested users:', error);
                    // Fallback to simple query if RPC fails
                    const { data: fallbackData } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, avatar_url, bio, verified, followers_count')
                        .neq('id', user.id)
                        .order('followers_count', { ascending: false, nullsFirst: false })
                        .limit(20);

                    setSuggestedUsers(fallbackData || []);
                } else {
                    setSuggestedUsers(data || []);
                }
            } catch (error) {
                console.error('Fetch suggestions error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [user]);

    // Search users (debounced)
    useEffect(() => {
        if (!searchQuery.trim()) {
            return;
        }

        const searchUsers = setTimeout(async () => {
            setSearching(true);

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, bio, verified, followers_count')
                    .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                    .neq('id', user.id)
                    .limit(10);

                if (error) throw error;
                setSuggestedUsers(data || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(searchUsers);
    }, [searchQuery, user.id]);

    const handleFollow = (userId) => {
        if (followedUsers.includes(userId)) {
            updateFormData('followedUsers', followedUsers.filter(id => id !== userId));
        } else {
            updateFormData('followedUsers', [...followedUsers, userId]);
        }
    };

    const handleSkip = () => {
        // Skip to step 4 (notifications)
        onNext();
    };

    const canContinue = followedUsers.length >= 5;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Find people to follow</h2>
                <p className={styles.subtitle}>Discover creators and friends</p>
            </div>

            {/* Search */}
            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
                {searching && <span className={styles.searching}>🔍</span>}
            </div>

            {/* Suggested Users */}
            <div className={styles.list}>
                {loading ? (
                    <div className={styles.loading}>Loading suggestions...</div>
                ) : suggestedUsers.length === 0 ? (
                    <div className={styles.empty}>No users found</div>
                ) : (
                    suggestedUsers.map(suggestedUser => (
                        <SuggestedUserCard
                            key={suggestedUser.id}
                            user={suggestedUser}
                            isFollowing={followedUsers.includes(suggestedUser.id)}
                            onFollow={() => handleFollow(suggestedUser.id)}
                        />
                    ))
                )}
            </div>

            <div className={styles.followCount}>
                Followed: {followedUsers.length} people
                {followedUsers.length < 5 && (
                    <span className={styles.hint}> (Follow at least 5 to get started)</span>
                )}
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={handleSkip}>Skip</Button>
                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={!canContinue}
                >
                    Continue
                </Button>
            </div>

            <div className={styles.progressInfo}>
                <span>Step 3 of 4</span>
            </div>
        </div>
    );
};

export default StepFollowUsers;
