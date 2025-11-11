import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ExploreTile from './ExploreTile';
import { supabase } from '../supabaseClient';
import './ExploreGrid.css';

export default function ExploreGrid({ items, activeTab, user, onItemInteraction }) {
  const [likedItems, setLikedItems] = useState(new Set());
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const navigate = useNavigate();

  const handleLike = async (item) => {
    if (!user) return;

    const isLiked = likedItems.has(item.item_id);
    const newLikedItems = new Set(likedItems);

    if (isLiked) {
      newLikedItems.delete(item.item_id);
    } else {
      newLikedItems.add(item.item_id);
    }

    setLikedItems(newLikedItems);
    onItemInteraction?.(item, 'like');

    try {
      const contentType = item.item_type === 'boltz' ? 'boltz' : 'post';
      
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq(`${contentType}_id`, item.item_id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert([{
            [`${contentType}_id`]: item.item_id,
            user_id: user.id
          }]);
      }
    } catch (error) {
      setLikedItems(likedItems);
      console.error('Error toggling like:', error);
    }
  };

  const handleFollow = async (item) => {
    if (!user || item.item_type !== 'user') return;

    const isFollowing = followedUsers.has(item.item_id);
    const newFollowedUsers = new Set(followedUsers);

    if (isFollowing) {
      newFollowedUsers.delete(item.item_id);
    } else {
      newFollowedUsers.add(item.item_id);
    }

    setFollowedUsers(newFollowedUsers);
    onItemInteraction?.(item, 'follow');

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', item.item_id);
      } else {
        await supabase
          .from('follows')
          .insert([{
            follower_id: user.id,
            following_id: item.item_id
          }]);
      }
    } catch (error) {
      setFollowedUsers(followedUsers);
      console.error('Error toggling follow:', error);
    }
  };

  const handleItemClick = (item) => {
    onItemInteraction?.(item, 'view');

    switch (item.item_type) {
      case 'post':
        navigate(`/post/${item.item_id}`);
        break;
      case 'boltz':
        navigate(`/boltz/${item.item_id}`);
        break;
      case 'flash':
        navigate(`/flash/${item.username}?story=${item.item_id}`);
        break;
      case 'user':
        navigate(`/profile/${item.username}`);
        break;
      case 'hashtag':
        navigate(`/explore?q=${encodeURIComponent(item.hashtag)}`);
        break;
      default:
        break;
    }
  };

  const getGridClassName = () => {
    switch (activeTab) {
      case 'people':
        return 'explore-grid people-grid';
      case 'tags':
        return 'explore-grid tags-grid';
      default:
        return 'explore-grid masonry-grid';
    }
  };

  return (
    <div className={getGridClassName()}>
      {items.map((item, index) => (
        <motion.div
          key={`${item.item_type}-${item.item_id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <ExploreTile
            item={item}
            activeTab={activeTab}
            isLiked={likedItems.has(item.item_id)}
            isFollowing={followedUsers.has(item.item_id)}
            onLike={() => handleLike(item)}
            onFollow={() => handleFollow(item)}
            onClick={() => handleItemClick(item)}
          />
        </motion.div>
      ))}
    </div>
  );
}