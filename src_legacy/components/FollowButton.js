import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import styles from './FollowButton.module.css';
import './FollowButton.css';

/**
 * FollowButton - Button to follow/unfollow a user.
 * @component
 * @param {string} myUserId - Current user ID
 * @param {string} profileUserId - Profile user ID
 * @param {boolean} [isPrivate] - Is profile private
 * @param {function} [onFollowChange] - Handler for follow change
 * @returns {React.ReactElement}
 */
const FollowButton = React.memo(function FollowButton({ myUserId, profileUserId, isPrivate = false, onFollowChange }) {
  const [followStatus, setFollowStatus] = useState(null); // null, 'pending', 'accepted'
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (myUserId && profileUserId && myUserId !== profileUserId) {
      checkFollowStatus();
    } else {
      setChecking(false);
    }
  }, [myUserId, profileUserId]);

  const checkFollowStatus = useCallback(async () => {
    if (!myUserId || !profileUserId) return;

    try {
      setChecking(true);
      
      const { data, error } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', myUserId)
        .eq('following_id', profileUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (mounted.current) {
        setFollowStatus(data?.status || null);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
      if (mounted.current) {
        setFollowStatus(null);
      }
    } finally {
      if (mounted.current) {
        setChecking(false);
      }
    }
  }, [myUserId, profileUserId]);

  const handleFollow = async () => {
    if (!myUserId || !profileUserId || loading) return;

    const previousStatus = followStatus;

    try {
      setLoading(true);

      if (followStatus) {
        // Optimistic UI update
        setFollowStatus(null);

        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', myUserId)
          .eq('following_id', profileUserId);

        if (error) throw error;

        // Remove notification
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', profileUserId)
          .eq('actor_id', myUserId)
          .eq('type', 'follow');

        if (mounted.current && onFollowChange) {
          onFollowChange('unfollowed');
        }

      } else {
        // Follow
        const newStatus = isPrivate ? 'pending' : 'accepted';
        
        // Optimistic UI update
        setFollowStatus(newStatus);

        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: myUserId,
            following_id: profileUserId,
            status: newStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        if (mounted.current && onFollowChange) {
          onFollowChange('followed');
        }

        // Create notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: profileUserId,
            actor_id: myUserId,
            type: 'follow',
            created_at: new Date().toISOString(),
            is_read: false
          });

        if (notifError) {
          console.error('Error creating notification:', notifError);
          // Don't throw - follow still succeeded
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      
      // Rollback on error
      if (mounted.current) {
        setFollowStatus(previousStatus);
      }
      
      // Show error to user
      alert('Failed to update follow status. Please try again.');
      
      // Recheck status
      await checkFollowStatus();
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  // Don't show button for own profile
  if (!myUserId || !profileUserId || myUserId === profileUserId) {
    return null;
  }

  if (checking) {
    return (
      <button className={styles.btnFollow} disabled aria-label="Loading follow status">
        <span className={styles.loadingSpinnerSmall} aria-hidden="true"></span>
      </button>
    );
  }

  const getButtonText = () => {
    if (loading) return '...';
    if (followStatus === 'pending') return 'Requested';
    if (followStatus === 'accepted') return 'Following';
    return 'Follow';
  };

  const getButtonClass = () => {
    let baseClass = styles.btnFollow;
    if (followStatus === 'accepted') baseClass += ` ${styles.btnFollowing}`;
    if (followStatus === 'pending') baseClass += ` ${styles.btnPending}`;
    if (loading) baseClass += ` ${styles.btnLoading}`;
    return baseClass;
  };

  const getAriaLabel = () => {
    if (loading) return 'Processing';
    if (followStatus === 'pending') return 'Cancel follow request';
    if (followStatus === 'accepted') return 'Unfollow';
    return 'Follow';
  };

  return (
    <motion.button
      className={`${getButtonClass()} follow-btn unfollow-btn`}
      onClick={handleFollow}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      aria-label={getAriaLabel()}
      aria-pressed={!!followStatus}
      data-testid="follow-button"
      id={`follow-btn-${profileUserId}`}
    >
      {getButtonText()}
    </motion.button>
  );
});

FollowButton.displayName = 'FollowButton';
FollowButton.propTypes = {
  myUserId: PropTypes.string.isRequired,
  profileUserId: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
  onFollowChange: PropTypes.func
};

export default FollowButton;
