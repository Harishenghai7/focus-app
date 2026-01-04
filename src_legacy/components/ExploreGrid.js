// src/components/ExploreGrid.js
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Video } from 'lucide-react';
import { formatNumber } from '../utils/formatNumber';
import './ExploreGrid.css';

const ExploreGrid = ({ items, type, variants }) => {
  
  if (type === 'people') {
    return (
      <div className="people-grid">
        {items.map((person) => (
          <motion.div 
            key={person.id} 
            variants={variants} 
            className="person-card glass-panel"
          >
            <img src={person.avatar_url || '/default-avatar.png'} alt={person.username} />
            <div className="person-info">
              <h4>{person.full_name}</h4>
              <span>@{person.username}</span>
            </div>
            <button className="follow-btn-small">Follow</button>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="media-grid">
      {items.map((post) => (
        <motion.div 
          key={post.id}
          variants={variants}
          className="grid-item"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Media */}
          {post.media_type === 'video' ? (
             <video src={post.media_urls[0]} muted />
          ) : (
             <img src={post.media_urls[0]} alt="Post" loading="lazy" />
          )}

          {/* Type Indicator */}
          {post.media_type === 'video' && (
            <div className="type-icon">
              <Video size={16} color="white" />
            </div>
          )}

          {/* Overlay (Hover) */}
          <div className="grid-overlay">
            <div className="overlay-stat">
              <Heart size={20} fill="white" stroke="white" />
              <span>{formatNumber(post.post_likes?.[0]?.count || 0)}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ExploreGrid;