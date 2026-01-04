import React, { useState } from 'react';
import styles from './SuggestedUserCard.module.css';
import Avatar from '../shared/Avatar';
import { supabase } from '../../lib/supabase';

const SuggestedUserCard = ({ user }) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        setLoading(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;

            if (isFollowing) {
                await supabase
                    .from('follows')
                    .delete()
                    .match({ follower_id: currentUser.id, following_id: user.id });
                setIsFollowing(false);
            } else {
                await supabase
                    .from('follows')
                    .insert({ follower_id: currentUser.id, following_id: user.id });
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.userInfo}>
                <Avatar src={user.avatar_url} size="md" />
                <div className={styles.details}>
                    <span className={styles.username}>{user.username}</span>
                    <span className={styles.fullName}>{user.full_name}</span>
                </div>
            </div>
            <button
                className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                onClick={handleFollow}
                disabled={loading}
            >
                {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
        </div>
    );
};

export default SuggestedUserCard;
