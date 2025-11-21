import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import NotificationManager from '../utils/NotificationManager';
import LazyImage from './LazyImage';
import styles from './UserSearchResult.module.css';

/**
 * UserSearchResult - Displays a user search result with follow button.
 * @component
 * @param {Object} user - User object
 * @param {Object} currentUser - Current user object
 * @param {function} onFollowChange - Handler for follow change
 * @returns {React.ReactElement}
 */
const UserSearchResult = React.memo(function UserSearchResult({ user, currentUser, onFollowChange }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (currentUser?.id && user.id) {
      checkFollowStatus();
    }
  }, [user.id, currentUser?.id]);
  
  const checkFollowStatus = async () => {
    if (!currentUser) return;
    
    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', user.id)
        .maybeSingle();
      
      setFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };
  
  const handleFollow = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking follow button
    
    if (loading || !currentUser) return;
    
    setLoading(true);
    const wasFollowing = following;
    const newFollowing = !wasFollowing;
    
    // Optimistic update
    setFollowing(newFollowing);
    
    try {
      if (wasFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert([{ 
            follower_id: currentUser.id, 
            following_id: user.id 
          }]);
          
        // Create follow notification
        await NotificationManager.createNotification('follow', {
          recipient_id: user.id,
          actor_id: currentUser.id
        });
      }
      
      // Notify parent component of follow change
      onFollowChange?.(user.id, newFollowing);
      
    } catch (error) {
      console.error('Follow error:', error);
      // Revert optimistic update on error
      setFollowing(wasFollowing);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUserClick = () => {
    navigate(`/profile/${user.username || user.id}`);
  };
  
  const getAvatar = (avatarUrl) => {
    return avatarUrl && avatarUrl.trim() ? avatarUrl : '/default-avatar.png';
  };
  
  return (
    <motion.div 
      className={styles['user-search-result']}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      onClick={handleUserClick}
      role="button"
      tabIndex={0}
      aria-label={`View profile of ${user.username || user.full_name}`}
    >
      <div className={styles['user-avatar-container']}>
        <LazyImage 
          src={getAvatar(user.avatar_url)}
          alt={user.username || user.full_name}
          className={styles['user-search-avatar']}
          threshold={0.1}
        />
      </div>
      
      <div className={styles['user-search-info']}>
        <div className={styles['user-search-primary']}>
          <span className={styles['user-search-username']}>
            {user.username || user.full_name}
          </span>
          {user.verified && (
            <span className={styles['verified-badge']} title="Verified">✓</span>
          )}
        </div>
        
        <div className={styles['user-search-secondary']}>
          <span className={styles['user-search-fullname']}>{user.full_name}</span>
          {user.follower_count > 0 && (
            <span className={styles['user-search-followers']}>
              {user.follower_count} {user.follower_count === 1 ? 'follower' : 'followers'}
            </span>
          )}
        </div>
        
        {user.bio && (
          <div className={styles['user-search-bio']}>
            {user.bio.substring(0, 60)}
            {user.bio.length > 60 && '...'}
          </div>
        )}
      </div>
      
      {currentUser?.id !== user.id && (
        <div className={styles['user-search-actions']}>
          <motion.button 
            className={`${styles['follow-btn']} ${following ? styles['following'] : ''} ${loading ? styles['loading'] : ''}`}
            onClick={handleFollow}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            aria-label={following ? 'Unfollow' : 'Follow'}
          >
            {loading ? (
              <div className={`${styles['loading-spinner']} ${styles['small']}`}></div>
            ) : following ? (
              'Following'
            ) : (
              'Follow'
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
});

UserSearchResult.displayName = 'UserSearchResult';
UserSearchResult.propTypes = {
  user: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  onFollowChange: PropTypes.func
};

export default UserSearchResult;