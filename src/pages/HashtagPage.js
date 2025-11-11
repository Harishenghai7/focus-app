import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './HashtagPage.css';

export default function HashtagPage({ user, userProfile }) {
  const { hashtag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashtagData, setHashtagData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    fetchHashtagData();
    fetchHashtagPosts();
    checkFollowStatus();
  }, [hashtag]);

  const fetchHashtagData = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .eq('tag', hashtag.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching hashtag data:', error);
      }

      setHashtagData(data);
    } catch (error) {
      console.error('Error fetching hashtag data:', error);
    }
  };

  const fetchHashtagPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts through post_hashtags junction table
      const { data: postHashtags, error: hashtagError } = await supabase
        .from('hashtags')
        .select('id')
        .eq('tag', hashtag.toLowerCase())
        .single();

      if (hashtagError || !postHashtags) {
        // Fallback to caption search
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (
              id,
              username,
              full_name,
              avatar_url,
              is_verified
            )
          `)
          .ilike('caption', `%#${hashtag}%`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setPosts(data || []);
        setLoading(false);
        return;
      }

      // Fetch posts using junction table
      const { data: postData, error } = await supabase
        .from('post_hashtags')
        .select(`
          posts (
            *,
            profiles!posts_user_id_fkey (
              id,
              username,
              full_name,
              avatar_url,
              is_verified
            )
          )
        `)
        .eq('hashtag_id', postHashtags.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const posts = (postData || [])
        .map(item => item.posts)
        .filter(post => post !== null);

      setPosts(posts);
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('followed_hashtags')
        .select('id')
        .eq('user_id', user.id)
        .eq('hashtag', hashtag.toLowerCase())
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // Not following
      setIsFollowing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('followed_hashtags')
          .delete()
          .eq('user_id', user.id)
          .eq('hashtag', hashtag.toLowerCase());
        
        setIsFollowing(false);
      } else {
        // Follow
        await supabase
          .from('followed_hashtags')
          .insert([{
            user_id: user.id,
            hashtag: hashtag.toLowerCase()
          }]);
        
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling hashtag follow:', error);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/hashtag/${hashtag}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `#${hashtag}`,
          text: `Check out #${hashtag} on Focus`,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (activeTab === 'recent') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (activeTab === 'popular') {
      return (b.like_count || 0) - (a.like_count || 0);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="hashtag-page">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading #{hashtag}...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="hashtag-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="hashtag-header">
        <div className="hashtag-header-content">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="hashtag-info">
            <div className="hashtag-title">
              <div className="hashtag-icon">#</div>
              <h1>{hashtag}</h1>
            </div>
            <div className="hashtag-stats">
              <div className="hashtag-stat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>{hashtagData?.post_count || posts.length} posts</span>
              </div>
            </div>
          </div>

          <div className="hashtag-actions">
            <motion.button
              className={`follow-hashtag-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              whileTap={{ scale: 0.95 }}
            >
              {isFollowing ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Following
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Follow
                </>
              )}
            </motion.button>
            
            <motion.button
              className="share-hashtag-btn"
              onClick={handleShare}
              whileTap={{ scale: 0.95 }}
              aria-label="Share hashtag"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="hashtag-content">
        <div className="hashtag-tabs">
          <button
            className={`hashtag-tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent
          </button>
          <button
            className={`hashtag-tab ${activeTab === 'popular' ? 'active' : ''}`}
            onClick={() => setActiveTab('popular')}
          >
            Popular
          </button>
        </div>

        <AnimatePresence mode="wait">
          {sortedPosts.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <h3>No posts found</h3>
              <p>Be the first to post with #{hashtag}</p>
            </motion.div>
          ) : (
            <motion.div 
              className="posts-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {sortedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="post-tile"
                  onClick={() => navigate(`/post/${post.id}`)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img 
                    src={post.media_url || post.media_urls?.[0] || post.image_url} 
                    alt={post.caption || ''} 
                    className="post-image"
                    loading="lazy"
                  />
                  <div className="post-overlay">
                    <div className="post-stats">
                      <span>
                        <svg viewBox="0 0 24 24" fill="white">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {post.like_count || 0}
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="white">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                        {post.comment_count || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
