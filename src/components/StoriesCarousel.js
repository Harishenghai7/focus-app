import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { formatDate } from '../utils/formatters/formatDate';
import './StoriesCarousel.css';

/**
 * StoriesCarousel Component
 * 
 * Features:
 * - Horizontal scrolling stories carousel
 * - Own story at front with + icon
 * - Colored ring for unviewed stories, gray for viewed
 * - Click to open full-screen viewer
 * - Story creation button
 * - Loading state with skeletons
 * 
 * @param {Object} user - Current user object
 * @param {Function} onStoryClick - Callback when story is clicked (username, storyId)
 * @param {Function} onAddStory - Callback when add story is clicked
 */
const StoriesCarousel = ({ user, onStoryClick, onAddStory }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchStories();
    }
  }, [user?.id]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Get following users
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = (following || [])?.map(f => f.following_id) || [];
      const userIds = [user.id, ...followingIds];

      // Get active flash stories (not expired)
      const { data: storiesData, error } = await supabase
        .from('flash')
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          created_at,
          expires_at,
          profiles:user_id(
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .in('user_id', userIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get viewed flash IDs for the current user
      const { data: viewedFlash } = await supabase
        .from('flash_views')
        .select('flash_id')
        .eq('viewer_id', user.id);

      const viewedIds = new Set((viewedFlash || [])?.map(v => v.flash_id) || []);

      // Group stories by user and check if unviewed
      const groupedStories = {};
      (storiesData || []).forEach(story => {
        const userId = story.user_id;
        if (!groupedStories[userId]) {
          groupedStories[userId] = {
            user: story.profiles,
            stories: [],
            hasUnread: false
          };
        }
        groupedStories[userId].stories.push(story);
        // Mark as unread if any story from this user is unviewed (except own stories)
        if (!viewedIds.has(story.id) && userId !== user.id) {
          groupedStories[userId].hasUnread = true;
        }
      });

      // Convert to array and sort (own story first, then by latest story)
      const storiesArray = Object.values(groupedStories).sort((a, b) => {
        if (a.user.id === user.id) return -1;
        if (b.user.id === user.id) return 1;
        return new Date(b.stories[0].created_at) - new Date(a.stories[0].created_at);
      });

      setStories(storiesArray);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 100;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="stories-carousel">
        <div className="stories-scroll">
          {([...Array(5)] || []).map((_, i) => (
            <div key={i} className="story-item skeleton">
              <div className="story-avatar skeleton-circle"></div>
              <div className="story-username skeleton-text"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="stories-carousel">
      <button 
        className="scroll-btn scroll-left"
        onClick={() => scroll('left')}
        aria-label="Scroll stories left"
      >
        ‹
      </button>
      
      <div className="stories-scroll" ref={scrollRef}>
        {/* Add Story Button */}
        <motion.div
          className="story-item add-story"
          onClick={onAddStory}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          role="button"
          aria-label="Create your story"
          tabIndex={0}
        >
          <div className="story-avatar add-story-avatar">
            <img 
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'You')}`} 
              alt="Your avatar"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'You')}`;
              }}
            />
            <div className="add-story-plus" aria-hidden="true">+</div>
          </div>
          <span className="story-username">Your Story</span>
        </motion.div>

        {/* Stories */}
        <AnimatePresence>
          {(stories || []).map((storyGroup, index) => {
            const userAvatar = storyGroup?.user?.avatar_url || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(storyGroup?.user?.username || 'User')}`;
            
            return (
              <motion.div
                key={storyGroup.user.id}
                className={`story-item ${storyGroup.hasUnread ? 'unread' : 'read'}`}
                onClick={() => {
                  if (storyGroup?.stories?.[0]?.id) {
                    onStoryClick(storyGroup.user.username, storyGroup.stories[0].id);
                  }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                role="button"
                aria-label={`View ${storyGroup.user.username}'s story${storyGroup.hasUnread ? ' (new)' : ''}`}
                tabIndex={0}
              >
                <div className={`story-avatar ${storyGroup.hasUnread ? 'has-ring' : 'viewed'}`}>
                  <img 
                    src={userAvatar} 
                    alt={`${storyGroup.user.username}'s avatar`}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(storyGroup?.user?.username || 'User')}`;
                    }}
                  />
                  {storyGroup.hasUnread && <div className="story-ring" aria-hidden="true"></div>}
                </div>
                <span className="story-username" title={storyGroup.user.username}>
                  {storyGroup.user.username}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <button 
        className="scroll-btn scroll-right"
        onClick={() => scroll('right')}
        aria-label="Scroll stories right"
      >
        ›
      </button>
    </div>
  );
};

StoriesCarousel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string,
    avatar_url: PropTypes.string
  }).isRequired,
  onStoryClick: PropTypes.func.isRequired,
  onAddStory: PropTypes.func.isRequired
};

export default StoriesCarousel;
