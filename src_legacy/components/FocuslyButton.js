/**
 * ============================================================================
 * 🦁 FOCUSLY FLOATING BUTTON - PRODUCTION GRADE
 * ============================================================================
 * 
 * Floating action button for Focusly AI Chat
 * - Fixed position at bottom-right
 * - Animated entrance
 * - Pulse effect for attention
 * - Click to open Focusly chat
 * - Mobile & desktop responsive
 * - Accessibility support
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './FocuslyButton.css';

const FocuslyButton = ({ onClick, showPulse = true }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay entrance for smooth animation
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/focusly');
    }
  };

  if (!isVisible) return null;

  return (
    <motion.button
      className={`focusly-float-btn ${showPulse ? 'pulse' : ''}`}
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      aria-label="Open Focusly AI Assistant"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="focusly-icon-wrapper">
        <img 
          src="/focusly-icon.png" 
          alt="Focusly AI" 
          className="focusly-icon"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%238B7FD7"/%3E%3Ctext x="50" y="65" font-size="40" text-anchor="middle" fill="white"%3E🦁%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
      <span className="focusly-tooltip">Chat with Focusly AI</span>
    </motion.button>
  );
};

export default FocuslyButton;
