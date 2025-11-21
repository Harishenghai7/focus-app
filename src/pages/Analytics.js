import React, { useState, useEffect } from 'react';
import { components, hooks, utils } from '@/importMap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout/Layout';
import StatCard from '../components/StatCard';
import ChartComponent from '../components/ChartComponent';
import { formatCompactNumber, formatPercentage, calculatePercentageChange } from '../utils/formatters/formatPercentage';
import './Analytics.css';

export default function Analytics({ user, userProfile }) {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    totalShares: 0,
    followers: 0,
    following: 0,
    engagement: 0,
    avgLikesPerPost: 0,
    avgCommentsPerPost: 0,
    reachRate: 0
  });
  const [previousAnalytics, setPreviousAnalytics] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [followerGrowth, setFollowerGrowth] = useState([]);
  const [audienceData, setAudienceData] = useState(null);
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const previousStartDate = new Date(startDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      // Fetch current period posts
      const { data: postsData, count: postsCount } = await supabase
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
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch previous period posts for comparison
      const { count: previousPostsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Calculate totals
      const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
      const totalComments = postsData?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;
      const totalShares = postsData?.reduce((sum, post) => sum + (post.shares_count || 0), 0) || 0;
      const totalViews = postsData?.length * 100 + Math.floor(Math.random() * 1000); // Simulated

      // Fetch current followers/following counts
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      // Fetch follower growth data
      const { data: followsData } = await supabase
        .from('follows')
        .select('created_at')
        .eq('following_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Process follower growth
      const growthData = processFollowerGrowth(followsData, startDate, now, daysAgo);

      // Calculate engagement metrics
      const totalEngagement = totalLikes + totalComments + totalShares;
      const engagementRate = postsCount > 0 && followersCount > 0 
        ? ((totalEngagement / (postsCount * followersCount)) * 100) 
        : 0;
      
      const avgLikesPerPost = postsCount > 0 ? totalLikes / postsCount : 0;
      const avgCommentsPerPost = postsCount > 0 ? totalComments / postsCount : 0;
      const reachRate = followersCount > 0 ? (totalViews / followersCount) * 100 : 0;

      // Find top performing posts
      const sortedPosts = [...(postsData || [])].sort((a, b) => {
        const scoreA = (a.likes_count || 0) + (a.comments_count || 0) * 2 + (a.shares_count || 0) * 3;
        const scoreB = (b.likes_count || 0) + (b.comments_count || 0) * 2 + (b.shares_count || 0) * 3;
        return scoreB - scoreA;
      });

      const currentAnalytics = {
        totalPosts: postsCount || 0,
        totalLikes,
        totalComments,
        totalViews,
        totalShares,
        followers: followersCount || 0,
        following: followingCount || 0,
        engagement: Math.min(engagementRate, 100),
        avgLikesPerPost,
        avgCommentsPerPost,
        reachRate: Math.min(reachRate, 100)
      };

      setAnalytics(currentAnalytics);
      setPreviousAnalytics({ totalPosts: previousPostsCount || 0 });
      setRecentPosts(postsData || []);
      setTopPosts(sortedPosts.slice(0, 5));
      setFollowerGrowth(growthData);
      
      // Simulate audience demographics
      setAudienceData(generateAudienceData(followersCount));

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processFollowerGrowth = (followsData, startDate, endDate, days) => {
    const growthMap = {};
    const dataPoints = Math.min(days, 30); // Max 30 data points for chart
    const interval = Math.ceil(days / dataPoints);

    // Initialize with zeros
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(startDate.getTime() + (i * interval * 24 * 60 * 60 * 1000));
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      growthMap[label] = { label, value: 0, date };
    }

    // Count followers per day
    let cumulativeCount = 0;
    followsData?.forEach(follow => {
      const followDate = new Date(follow.created_at);
      const daysDiff = Math.floor((followDate - startDate) / (1000 * 60 * 60 * 24));
      const index = Math.floor(daysDiff / interval);
      const date = new Date(startDate.getTime() + (index * interval * 24 * 60 * 60 * 1000));
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (growthMap[label]) {
        cumulativeCount++;
        growthMap[label].value = cumulativeCount;
      }
    });

    // Fill in cumulative values
    let lastValue = 0;
    Object.keys(growthMap).forEach(key => {
      if (growthMap[key].value === 0 && lastValue > 0) {
        growthMap[key].value = lastValue;
      }
      lastValue = growthMap[key].value;
    });

    return Object.values(growthMap);
  };

  const generateAudienceData = (totalFollowers) => {
    // Simulate audience demographics (in a real app, this would come from actual data)
    return {
      ageGroups: [
        { label: '13-17', value: Math.floor(totalFollowers * 0.15) },
        { label: '18-24', value: Math.floor(totalFollowers * 0.35) },
        { label: '25-34', value: Math.floor(totalFollowers * 0.30) },
        { label: '35-44', value: Math.floor(totalFollowers * 0.12) },
        { label: '45+', value: Math.floor(totalFollowers * 0.08) }
      ],
      topLocations: [
        { name: 'United States', percentage: 45 },
        { name: 'United Kingdom', percentage: 18 },
        { name: 'Canada', percentage: 12 },
        { name: 'Australia', percentage: 8 },
        { name: 'Other', percentage: 17 }
      ],
      genderSplit: {
        male: 48,
        female: 50,
        other: 2
      }
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getChangePercentage = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return calculatePercentageChange(previous, current);
  };

  const getTrend = (change) => {
    if (Math.abs(change) < 1) return 'neutral';
    return change > 0 ? 'up' : 'down';
  };

  if (loading) {
    return (
      <Layout layoutType="dashboard">
        <div className="page page-analytics">
          <div className="analytics-loading">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const postsChange = getChangePercentage(analytics.totalPosts, previousAnalytics?.totalPosts);

  return (
    <Layout layoutType="dashboard">
      <motion.div 
        className="page page-analytics"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header with Date Range Selector */}
        <div className="analytics-header">
          <div className="analytics-header-left">
            <button 
              className="back-btn" 
              onClick={() => navigate('/profile')}
              aria-label="Go back to profile"
            >
              <span>←</span>
            </button>
            <div className="analytics-header-title">
              <h1>Analytics Dashboard</h1>
              <p className="analytics-subtitle">Track your performance and growth</p>
            </div>
          </div>
          
          <div className="date-range-selector">
            <label htmlFor="date-range">Period:</label>
            <select 
              id="date-range"
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="date-range-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last year</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="analytics-content">
          {/* Key Metrics Overview */}
          <section className="metrics-section">
            <h2 className="section-title">Overview</h2>
            <div className="stats-grid">
              <StatCard
                icon="📊"
                label="Posts"
                value={formatCompactNumber(analytics.totalPosts)}
                change={postsChange}
                trend={getTrend(postsChange)}
                color="primary"
              />
              <StatCard
                icon="❤️"
                label="Total Likes"
                value={formatCompactNumber(analytics.totalLikes)}
                color="danger"
              />
              <StatCard
                icon="💬"
                label="Comments"
                value={formatCompactNumber(analytics.totalComments)}
                color="info-color"
              />
              <StatCard
                icon="👁️"
                label="Views"
                value={formatCompactNumber(analytics.totalViews)}
                color="warning"
              />
              <StatCard
                icon="👥"
                label="Followers"
                value={formatCompactNumber(analytics.followers)}
                color="success"
              />
              <StatCard
                icon="📈"
                label="Engagement Rate"
                value={formatPercentage(analytics.engagement)}
                color="primary"
              />
            </div>
          </section>

          {/* Follower Growth Chart */}
          {followerGrowth.length > 0 && (
            <section className="chart-section">
              <h2 className="section-title">Follower Growth</h2>
              <div className="chart-container">
                <ChartComponent
                  data={followerGrowth}
                  type="line"
                  height={250}
                  color="#667eea"
                  label={`${formatCompactNumber(analytics.followers)} Total Followers`}
                />
              </div>
            </section>
          )}

          {/* Performance Metrics */}
          <section className="performance-section">
            <h2 className="section-title">Post Performance Metrics</h2>
            <div className="performance-grid">
              <div className="performance-card">
                <div className="performance-icon">📊</div>
                <div className="performance-info">
                  <h4>Avg. Likes per Post</h4>
                  <p className="performance-value">
                    {formatCompactNumber(analytics.avgLikesPerPost.toFixed(0))}
                  </p>
                </div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">�</div>
                <div className="performance-info">
                  <h4>Avg. Comments per Post</h4>
                  <p className="performance-value">
                    {formatCompactNumber(analytics.avgCommentsPerPost.toFixed(0))}
                  </p>
                </div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">🎯</div>
                <div className="performance-info">
                  <h4>Reach Rate</h4>
                  <p className="performance-value">
                    {formatPercentage(analytics.reachRate)}
                  </p>
                </div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">�</div>
                <div className="performance-info">
                  <h4>Total Shares</h4>
                  <p className="performance-value">
                    {formatCompactNumber(analytics.totalShares)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Top Posts */}
          {topPosts.length > 0 && (
            <section className="top-posts-section">
              <h2 className="section-title">Top Performing Posts</h2>
              <div className="top-posts-grid">
                {topPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    className="top-post-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <div className="top-post-rank">#{index + 1}</div>
                    <div className="top-post-media">
                      {post.media_type === 'video' ? (
                        <video src={post.video_url} alt="Post" />
                      ) : post.image_url ? (
                        <img src={post.image_url} alt="Post" />
                      ) : (
                        <div className="text-post-preview">
                          {post.caption?.substring(0, 100)}
                        </div>
                      )}
                    </div>
                    <div className="top-post-stats">
                      <div className="stat-item">
                        <span>❤️</span>
                        <span>{formatCompactNumber(post.likes_count || 0)}</span>
                      </div>
                      <div className="stat-item">
                        <span>💬</span>
                        <span>{formatCompactNumber(post.comments_count || 0)}</span>
                      </div>
                      <div className="stat-item">
                        <span>📤</span>
                        <span>{formatCompactNumber(post.shares_count || 0)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Audience Demographics */}
          {audienceData && (
            <section className="audience-section">
              <h2 className="section-title">Audience Demographics</h2>
              <div className="audience-grid">
                {/* Age Distribution */}
                <div className="audience-card">
                  <h3>Age Distribution</h3>
                  <div className="audience-bars">
                    {audienceData.ageGroups.map((group) => {
                      const percentage = analytics.followers > 0 
                        ? (group.value / analytics.followers) * 100 
                        : 0;
                      return (
                        <div key={group.label} className="audience-bar-item">
                          <span className="bar-label">{group.label}</span>
                          <div className="bar-container">
                            <motion.div
                              className="bar-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                          <span className="bar-value">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Locations */}
                <div className="audience-card">
                  <h3>Top Locations</h3>
                  <div className="location-list">
                    {audienceData.topLocations.map((location, index) => (
                      <div key={location.name} className="location-item">
                        <span className="location-rank">#{index + 1}</span>
                        <span className="location-name">{location.name}</span>
                        <span className="location-percentage">
                          {location.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gender Split */}
                <div className="audience-card">
                  <h3>Gender Distribution</h3>
                  <div className="gender-chart">
                    <div className="gender-item">
                      <div className="gender-icon">👨</div>
                      <div className="gender-info">
                        <span className="gender-label">Male</span>
                        <span className="gender-value">
                          {audienceData.genderSplit.male}%
                        </span>
                      </div>
                    </div>
                    <div className="gender-item">
                      <div className="gender-icon">👩</div>
                      <div className="gender-info">
                        <span className="gender-label">Female</span>
                        <span className="gender-value">
                          {audienceData.genderSplit.female}%
                        </span>
                      </div>
                    </div>
                    <div className="gender-item">
                      <div className="gender-icon">⚧</div>
                      <div className="gender-info">
                        <span className="gender-label">Other</span>
                        <span className="gender-value">
                          {audienceData.genderSplit.other}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Insights & Recommendations */}
          <section className="insights-section">
            <h2 className="section-title">Insights & Recommendations</h2>
            <div className="insights-grid">
              <motion.div 
                className="insight-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="insight-icon">🎯</div>
                <h4>Best Performing Content</h4>
                <p>
                  {topPosts.length > 0 
                    ? `Your ${topPosts[0]?.media_type || 'image'} posts generate the most engagement`
                    : 'Create more content to see insights'
                  }
                </p>
              </motion.div>
              
              <motion.div 
                className="insight-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="insight-icon">📈</div>
                <h4>Engagement Trend</h4>
                <p>
                  {analytics.engagement > 5 
                    ? `Great job! Your ${formatPercentage(analytics.engagement)} engagement rate is above average 🎉`
                    : 'Try posting more consistently to boost engagement'
                  }
                </p>
              </motion.div>
              
              <motion.div 
                className="insight-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="insight-icon">💡</div>
                <h4>Growth Opportunity</h4>
                <p>
                  {analytics.followers < 100 
                    ? 'Use relevant hashtags and engage with your community to grow faster'
                    : analytics.followers < 1000
                    ? 'You\'re building momentum! Keep engaging with your audience'
                    : 'Consider creating more video content for better reach'
                  }
                </p>
              </motion.div>

              <motion.div 
                className="insight-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="insight-icon">⏰</div>
                <h4>Posting Frequency</h4>
                <p>
                  {analytics.totalPosts < 5 
                    ? 'Post more regularly to increase your visibility'
                    : `You're posting consistently! Keep up the good work`
                  }
                </p>
              </motion.div>
            </div>
          </section>

          {/* Empty State */}
          {recentPosts.length === 0 && (
            <section className="empty-state-section">
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Data Available</h3>
                <p>Start creating posts to see your analytics</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/create')}
                >
                  Create Your First Post
                </button>
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}