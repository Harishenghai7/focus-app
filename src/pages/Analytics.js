import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Analytics.css';

export default function Analytics({ user, userProfile }) {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    followers: 0,
    following: 0,
    engagement: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id, timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Fetch recent posts with engagement
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          image_url,
          video_url,
          media_type,
          created_at,
          likes_count,
          comments_count,
          shares_count
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate totals
      const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
      const totalComments = postsData?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;
      const totalShares = postsData?.reduce((sum, post) => sum + (post.shares_count || 0), 0) || 0;
      const totalViews = postsData?.length * 100 + Math.floor(Math.random() * 1000); // Simulated

      // Fetch followers/following counts
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      // Calculate engagement rate
      const totalEngagement = totalLikes + totalComments + totalShares;
      const engagementRate = postsCount > 0 ? ((totalEngagement / (postsCount * (followersCount || 1))) * 100) : 0;

      setAnalytics({
        totalPosts: postsCount || 0,
        totalLikes,
        totalComments,
        totalViews,
        followers: followersCount || 0,
        following: followingCount || 0,
        engagement: Math.min(engagementRate, 100) // Cap at 100%
      });

      setRecentPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="page page-analytics">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="page page-analytics"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="analytics-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ← Back
        </button>
        <h1>Analytics</h1>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="timeframe-select"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="analytics-content">
        {/* Overview Cards */}
        <div className="stats-grid">
          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{formatNumber(analytics.totalPosts)}</h3>
              <p>Posts</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">❤️</div>
            <div className="stat-info">
              <h3>{formatNumber(analytics.totalLikes)}</h3>
              <p>Likes</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">💬</div>
            <div className="stat-info">
              <h3>{formatNumber(analytics.totalComments)}</h3>
              <p>Comments</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">👁️</div>
            <div className="stat-info">
              <h3>{formatNumber(analytics.totalViews)}</h3>
              <p>Views</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{formatNumber(analytics.followers)}</h3>
              <p>Followers</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>{analytics.engagement.toFixed(1)}%</h3>
              <p>Engagement</p>
            </div>
          </motion.div>
        </div>

        {/* Recent Posts Performance */}
        <div className="section">
          <h2>Recent Posts Performance</h2>
          {recentPosts.length === 0 ? (
            <div className="empty-state">
              <p>No posts in the selected timeframe</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/create')}
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="posts-performance">
              {recentPosts.map((post) => (
                <motion.div
                  key={post.id}
                  className="post-performance-item"
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <div className="post-thumbnail">
                    {post.media_type === 'video' ? (
                      <video src={post.video_url} />
                    ) : post.image_url ? (
                      <img src={post.image_url} alt="Post" />
                    ) : (
                      <div className="text-post-thumbnail">
                        <p>{post.caption?.substring(0, 50)}...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="post-performance-stats">
                    <div className="post-info">
                      <p className="post-caption">
                        {post.caption?.substring(0, 60)}
                        {post.caption?.length > 60 && '...'}
                      </p>
                      <span className="post-date">{formatDate(post.created_at)}</span>
                    </div>
                    
                    <div className="post-metrics">
                      <div className="metric">
                        <span className="metric-icon">❤️</span>
                        <span>{formatNumber(post.likes_count || 0)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-icon">💬</span>
                        <span>{formatNumber(post.comments_count || 0)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-icon">📤</span>
                        <span>{formatNumber(post.shares_count || 0)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="section">
          <h2>Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>Best Performing Content</h4>
              <p>
                {recentPosts.length > 0 
                  ? `Your ${recentPosts[0]?.media_type || 'text'} posts get the most engagement`
                  : 'Create more content to see insights'
                }
              </p>
            </div>
            
            <div className="insight-card">
              <h4>Engagement Trend</h4>
              <p>
                {analytics.engagement > 5 
                  ? 'Your engagement rate is above average! 🎉'
                  : 'Try posting more consistently to boost engagement'
                }
              </p>
            </div>
            
            <div className="insight-card">
              <h4>Growth Opportunity</h4>
              <p>
                {analytics.followers < 100 
                  ? 'Use hashtags and engage with others to grow your audience'
                  : 'Consider creating more video content for better reach'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}