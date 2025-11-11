import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import trendingService from '../utils/trendingService';
import './TrendingHashtags.css';

export default function TrendingHashtags({ limit = 10, showTitle = true }) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrending();
  }, [limit]);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const data = await trendingService.getTrendingHashtags(limit);
      setTrending(data);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (tag) => {
    navigate(`/hashtag/${tag}`);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="trending-hashtags">
        {showTitle && <h3 className="trending-title">Trending</h3>}
        <div className="trending-loading">
          <div className="loading-spinner-small"></div>
          <span>Loading trending...</span>
        </div>
      </div>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <div className="trending-hashtags">
      {showTitle && (
        <div className="trending-header">
          <h3 className="trending-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            Trending
          </h3>
        </div>
      )}
      
      <div className="trending-list">
        {trending.map((hashtag, index) => (
          <motion.button
            key={hashtag.id}
            className="trending-item"
            onClick={() => handleHashtagClick(hashtag.tag)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, backgroundColor: 'var(--hover-bg)' }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="trending-rank">{index + 1}</div>
            <div className="trending-content">
              <div className="trending-tag">
                <span className="hashtag-symbol">#</span>
                <span className="hashtag-text">{hashtag.tag}</span>
                {hashtag.trending_score > 50 && (
                  <svg className="trending-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                )}
              </div>
              <div className="trending-stats">
                {formatNumber(hashtag.post_count)} posts
              </div>
            </div>
            <svg className="trending-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
