import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import subscriptionManager from '../utils/subscriptionManager';
import styles from './Stories.module.css';

/**
 * Stories - Displays user and follower stories with real-time updates.
 * @component
 * @param {Object} user - Current user object
 * @param {Object} userProfile - User profile data
 * @returns {React.ReactElement}
 */
const Stories = React.memo(function Stories({ user, userProfile }) {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [userStory, setUserStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { 
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadAllStories();
    }
  }, [user?.id]);

  // ✅ ENHANCED: Real-time story updates with better error handling
  useEffect(() => {
    if (!user?.id) return;

    const storiesChannel = supabase
      .channel('stories_updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'flashes' },
        async (payload) => {
          if (!mounted.current) return;

          if (payload.new.user_id === user.id) {
            // User's own story
            const { data: fullStory } = await supabase
              .from('flashes')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (fullStory && new Date(fullStory.expires_at) > new Date() && mounted.current) {
              setUserStory(fullStory);
            }
          } else {
            // Follower's story - refresh stories list
            if (mounted.current) {
              await fetchStories();
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'flashes' },
        async (payload) => {
          if (!mounted.current) return;

          if (payload.new.user_id === user.id) {
            const { data: fullStory } = await supabase
              .from('flashes')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (fullStory && new Date(fullStory.expires_at) > new Date() && mounted.current) {
              setUserStory(fullStory);
            } else if (mounted.current) {
              setUserStory(null);
            }
          } else {
            await fetchStories();
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'flashes' },
        (payload) => {
          if (!mounted.current) return;

          if (payload.old.user_id === user.id) {
            setUserStory(null);
          } else {
            fetchStories();
          }
        }
      )
      .subscribe();

    subscriptionManager.add('stories_channel', storiesChannel, {
      component: 'Stories',
      type: 'realtime'
    });

    return () => {
      subscriptionManager.remove('stories_channel');
    };
  }, [user?.id]);

  // ✅ ENHANCED: Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (user?.id && mounted.current) {
        loadAllStories();
      }
    };

    window.addEventListener('refreshStories', handleRefresh);
    return () => window.removeEventListener('refreshStories', handleRefresh);
  }, [user?.id]);

  const loadAllStories = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchStories(),
        fetchUserStory()
      ]);
    } catch (err) {
      console.error('Error loading stories:', err);
      if (mounted.current) {
        setError('Failed to load stories');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  const fetchStories = async () => {
    if (!user?.id) return;
    
    try {
      // Get following list
      const { data: followingData, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (followError) throw followError;

      const followingIds = followingData?.map(f => f.following_id) || [];
      
      if (followingIds.length === 0) {
        if (mounted.current) {
          setStories([]);
        }
        return;
      }
      
      // Fetch active stories from following
      const { data: storiesData, error: storiesError } = await supabase
        .from('flashes')
        .select(`
          *,
          profiles!flashes_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .in('user_id', followingIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Group stories by user
      const groupedStories = {};
      
      storiesData?.forEach(story => {
        const userId = story.user_id;
        
        if (!groupedStories[userId]) {
          groupedStories[userId] = {
            user: story.profiles,
            stories: [],
            hasCloseFriends: false,
            unviewedCount: 0,
            latestStoryTime: story.created_at
          };
        }
        
        groupedStories[userId].stories.push(story);
        
        if (story.is_close_friends) {
          groupedStories[userId].hasCloseFriends = true;
        }
      });

      // Check for unviewed stories
      const userIds = Object.keys(groupedStories);
      
      for (const userId of userIds) {
        const storyIds = groupedStories[userId].stories.map(s => s.id);
        
        if (storyIds.length > 0) {
          const { data: views } = await supabase
            .from('flash_views')
            .select('flash_id')
            .eq('viewer_id', user.id)
            .in('flash_id', storyIds);
          
          const viewedIds = new Set(views?.map(v => v.flash_id) || []);
          groupedStories[userId].unviewedCount = storyIds.filter(id => !viewedIds.has(id)).length;
        }
      }

      if (mounted.current) {
        // Sort: unviewed first, then by latest story time
        const sortedStories = Object.values(groupedStories).sort((a, b) => {
          if (a.unviewedCount > 0 && b.unviewedCount === 0) return -1;
          if (a.unviewedCount === 0 && b.unviewedCount > 0) return 1;
          return new Date(b.latestStoryTime) - new Date(a.latestStoryTime);
        });

        setStories(sortedStories);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      if (mounted.current) {
        setStories([]);
      }
    }
  };

  const fetchUserStory = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('flashes')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (mounted.current) {
        setUserStory(data || null);
      }
    } catch (error) {
      console.error('Error fetching user story:', error);
      if (mounted.current) {
        setUserStory(null);
      }
    }
  };

  const handleYourFlashClick = useCallback(() => {
    if (userStory) {
      navigate(`/flash/${user.id}`);
    } else {
      navigate('/create', { state: { defaultTab: 'flash' } });
    }
  }, [userStory, user?.id, navigate]);

  const handleStoryClick = useCallback((userId) => {
    navigate(`/flash/${userId}`);
  }, [navigate]);

  // ✅ ENHANCED: Memoize user avatar
  const userAvatar = useMemo(() => {
    return userStory?.thumbnail_url || 
           userStory?.image_url || 
           userProfile?.avatar_url || 
           user?.user_metadata?.avatar_url || 
           '/default-avatar.png';
  }, [userStory, userProfile, user]);

  if (loading && stories.length === 0 && !userStory) {
    return (
      <div className={styles.storiesContainer} aria-label="Stories">
        <div className={styles.storiesScroll} role="list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${styles.storyItem} ${styles.skeletonStory}`} aria-hidden="true">
              <div className={`${styles.storyAvatar} ${styles.skeletonAvatar}`}></div>
              <div className={`${styles.storyUsername} ${styles.skeletonUsername}`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.storiesContainer} ${styles.storiesError}`}>
        <p>⚠️ {error}</p>
        <button onClick={loadAllStories} className={styles.btnRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.storiesContainer} aria-label="Stories" role="region">
      <div className={styles.storiesScroll} role="list">
        {/* Your Flash */}
        <motion.div 
          className={`${styles.storyItem} ${styles.yourFlash}`} 
          onClick={handleYourFlashClick}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          role="listitem"
          tabIndex={0}
          aria-label={userStory ? "View your story" : "Create your story"}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleYourFlashClick();
            }
          }}
        >
          <div className={`${styles.storyAvatar} ${userStory ? styles.hasStory : styles.addStory}`}>
            <motion.img
              src={userAvatar}
              alt="Your Flash"
              className={styles.avatarImg}
              loading="lazy"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            />
            {!userStory && (
              <motion.span
                className={styles.addStoryIcon}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="12" x2="16" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.span>
            )}
          </div>
          <span className={styles.storyUsername}>Your Flash</span>
        </motion.div>

        {/* Follower stories */}
        <AnimatePresence mode="popLayout">
          {stories.map((storyGroup, index) => (
            <motion.div
              key={storyGroup.user.id}
              className={styles.storyItem}
              onClick={() => handleStoryClick(storyGroup.user.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              role="listitem"
              tabIndex={0}
              aria-label={`View ${storyGroup.user.username || 'user'}'s story${storyGroup.unviewedCount > 0 ? `, ${storyGroup.unviewedCount} unviewed` : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStoryClick(storyGroup.user.id);
                }
              }}
            >
              <div 
                className={`${styles.storyAvatar} has-story ${storyGroup.unviewedCount > 0 ? styles.unviewed : styles.viewed} ${storyGroup.hasCloseFriends ? styles.closeFriends : ''}`}
              >
                <img
                  src={storyGroup.user.avatar_url || '/default-avatar.png'}
                  alt={`${storyGroup.user.username || 'User'}'s avatar`}
                  className={styles.avatarImg}
                  loading="lazy"
                />
                {storyGroup.unviewedCount > 0 && (
                  <span className={styles.unviewedBadge} aria-label={`${storyGroup.unviewedCount} unviewed`}>
                    {storyGroup.unviewedCount}
                  </span>
                )}
              </div>
              <span className={styles.storyUsername}>
                {storyGroup.user.username || storyGroup.user.full_name || 'User'}
                {storyGroup.user.verified && (
                  <span className={styles.verifiedBadge} aria-label="Verified">✓</span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && stories.length === 0 && (
          <motion.div 
            className={styles.storiesEmpty}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p>Follow people to see their stories</p>
          </motion.div>
        )}
      </div>
    </div>
  );
});

Stories.displayName = 'Stories';
Stories.propTypes = {
  user: PropTypes.object,
  userProfile: PropTypes.object
};

export default Stories;
