import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './FollowButton.css';

/**
 * Follow Button Component
 * Fixes Features #37, #60, #278: Follow/unfollow functionality with proper state management
 */
export default function FollowButton({ myUserId, profileUserId, isPrivate = false, onFollowChange }) {
  const [followStatus, setFollowStatus] = useState(null); // null, 'pending', 'active'
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (myUserId && profileUserId && myUserId !== profileUserId) {
      checkFollowStatus();
    }
  }, [myUserId, profileUserId]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', myUserId)
        .eq('following_id', profileUserId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFollowStatus(data.status);
        setIsFollowing(data.status === 'active');
      } else {
        setFollowStatus(null);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (loading || myUserId === profileUserId) return;

    setLoading(true);
    
    try {
      if (followStatus === 'active') {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', myUserId)
          .eq('following_id', profileUserId);

        if (error) throw error;

        setFollowStatus(null);
        setIsFollowing(false);
        
        // Feature #278: Follow notification - Remove notification
        await supabase
          .from('notifications')
          .delete()
          .eq('type', 'follow')
          .eq('actor_id', myUserId)
          .eq('recipient_id', profileUserId);

      } else if (followStatus === 'pending') {
        // Cancel pending request
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', myUserId)
          .eq('following_id', profileUserId);

        if (error) throw error;

        setFollowStatus(null);
        setIsFollowing(false);

      } else {
        // Follow or request to follow
        const status = isPrivate ? 'pending' : 'active';
        
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: myUserId,
            following_id: profileUserId,
            status: status
          });

        if (error) throw error;

        setFollowStatus(status);
        setIsFollowing(status === 'active');

        // Feature #278: Follow notification
        if (status === 'active') {
          await supabase
            .from('notifications')
            .insert({
              type: 'follow',
              recipient_id: profileUserId,
              actor_id: myUserId,
              created_at: new Date().toISOString()
            });
        } else {
          // Send follow request notification
          await supabase
            .from('notifications')
            .insert({
              type: 'follow_request',
              recipient_id: profileUserId,
              actor_id: myUserId,
              created_at: new Date().toISOString()
            });
        }
      }

      // Trigger callback for parent components
      if (onFollowChange) {
        onFollowChange(followStatus === 'active' ? 'unfollowed' : 'followed');
      }

    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for own profile
  if (!myUserId || !profileUserId || myUserId === profileUserId) {
    return null;
  }

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (followStatus === 'active') return 'Following';
    if (followStatus === 'pending') return 'Requested';
    return 'Follow';
  };

  const getButtonClass = () => {
    let baseClass = 'follow-button';
    if (followStatus === 'active') baseClass += ' following';
    if (followStatus === 'pending') baseClass += ' pending';
    if (loading) baseClass += ' loading';
    return baseClass;
  };

  return (
    <motion.button
      className={getButtonClass()}
      onClick={handleFollow}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
    >
      <span className="button-text">{getButtonText()}</span>
      {followStatus === 'active' && (
        <span className="unfollow-text">Unfollow</span>
      )}
    </motion.button>
  );
}