import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ExploreTile from './ExploreTile';
import supabase from '../supabaseClient';
import styles from './ExploreGrid.module.css';

/**
 * ExploreGrid - Grid for explore page items (posts, users).
 * @component
 * @param {Array} items - Items to display
 * @param {string} activeTab - Active tab ID
 * @param {Object} user - Current user object
 * @param {function} onItemInteraction - Handler for item interaction
 * @returns {React.ReactElement}
 */
const ExploreGrid = React.memo(function ExploreGrid({ items, activeTab, user, onItemInteraction }) {
  const [likedItems, setLikedItems] = useState(new Set());
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const navigate = useNavigate();

  const handleLike = async (item) => {
    if (!user) return;
    const isLiked = likedItems.has(item.itemid);
    const newLikedItems = new Set(likedItems);
    if (isLiked) {
      newLikedItems.delete(item.itemid);
    } else {
      newLikedItems.add(item.itemid);
    }
    setLikedItems(newLikedItems);
    onItemInteraction?.(item, 'like');
    try {
      const contentType = item.itemtype === 'boltz' ? 'boltz' : 'post';
      if (isLiked) {
        await supabase.from('likes').delete().eq(`${contentType}id`, item.itemid).eq('userid', user.id);
      } else {
        await supabase.from('likes').insert({ [`${contentType}id`]: item.itemid, userid: user.id });
      }
    } catch (error) {
      setLikedItems(likedItems);
      console.error('Error toggling like', error);
    }
  };

  const handleFollow = async (item) => {
    if (!user || item.itemtype !== 'user') return;
    const isFollowing = followedUsers.has(item.itemid);
    const newFollowedUsers = new Set(followedUsers);
    if (isFollowing) {
      newFollowedUsers.delete(item.itemid);
    } else {
      newFollowedUsers.add(item.itemid);
    }
    setFollowedUsers(newFollowedUsers);
    onItemInteraction?.(item, 'follow');
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('followerid', user.id).eq('followingid', item.itemid);
      } else {
        await supabase.from('follows').insert({ followerid: user.id, followingid: item.itemid });
      }
    } catch (error) {
      setFollowedUsers(followedUsers);
      console.error('Error toggling follow', error);
    }
  };

  const handleItemClick = (item) => {
    onItemInteraction?.(item, 'view');
    switch (item.itemtype) {
      case 'post':
        navigate(`/post/${item.itemid}`);
        break;
      case 'boltz':
        navigate(`/boltz/${item.itemid}`);
        break;
      case 'flash':
        navigate(`/flash/${item.username || item.itemid}`);
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
        return `${styles.exploreGrid} ${styles.peopleGrid}`;
      case 'tags':
        return `${styles.exploreGrid} ${styles.tagsGrid}`;
      default:
        return `${styles.exploreGrid} ${styles.masonryGrid}`;
    }
  };

  return (
    <div className={getGridClassName()}>
      {items.map((item, index) => (
        <motion.div
          key={`${item.itemtype}-${item.itemid}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <ExploreTile
            item={item}
            activeTab={activeTab}
            isLiked={likedItems.has(item.itemid)}
            isFollowing={followedUsers.has(item.itemid)}
            onLike={() => handleLike(item)}
            onFollow={() => handleFollow(item)}
            onClick={() => handleItemClick(item)}
            aria-label={`Item ${item.itemid}`}
            role="button"
          />
        </motion.div>
      ))}
    </div>
  );
});

ExploreGrid.displayName = 'ExploreGrid';
ExploreGrid.propTypes = {
  items: PropTypes.array.isRequired,
  activeTab: PropTypes.string,
  user: PropTypes.object,
  onItemInteraction: PropTypes.func
};

export default ExploreGrid;
