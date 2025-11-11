import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import NotificationManager from '../utils/NotificationManager';
import LazyImage from './LazyImage';
import './UserSearchResult.css';

const UserSearchResult = ({ user, currentUser, onFollowChange }) => {
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
      className="user-search-result"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      onClick={handleUserClick}
    >
      <div className="user-avatar-container">
        <LazyImage 
          src={getAvatar(user.avatar_url)}
          alt={user.username || user.full_name}
          className="user-search-avatar"
          threshold={0.1}
        />
      </div>
      
      <div className="user-search-info">
        <div className="user-search-primary">
          <span className="user-search-username">
            {user.username || user.full_name}
          </span>
          {user.verified && (
            <span className="verified-badge" title="Verified">✓</span>
          )}
        </div>
        
        <div className="user-search-secondary">
          <span className="user-search-fullname">{user.full_name}</span>
          {user.follower_count > 0 && (
            <span className="user-search-followers">
              {user.follower_count} {user.follower_count === 1 ? 'follower' : 'followers'}
            </span>
          )}
        </div>
        
        {user.bio && (
          <div className="user-search-bio">
            {user.bio.substring(0, 60)}
            {user.bio.length > 60 && '...'}
          </div>
        )}
      </div>
      
      {currentUser?.id !== user.id && (
        <div className="user-search-actions">
          <motion.button 
            className={`follow-btn ${following ? 'following' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleFollow}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            {loading ? (
              <div className="loading-spinner small"></div>
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
};

export default UserSearchResult;