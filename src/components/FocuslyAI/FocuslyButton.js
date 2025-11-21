/**
 * FocuslyButton Component
 * 
 * Floating AI assistant button that appears on the Home page
 * Opens Focusly AI chat interface when clicked
 * 
 * Features:
 * - Single circular button with Focusly logo
 * - Fixed bottom-right position
 * - Lavender gradient background (#9b87f5 to #7E69AB)
 * - Smooth pulse animation
 * - Shine effect animation
 * - Smooth hover and tap effects
 * - Opens Focusly AI chat interface
 * - Mobile responsive (positioned above bottom nav)
 * - Fully accessible with ARIA labels
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.user - Current user object for chat context
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocuslyAIChat from './FocuslyAIChat';
import focuslyImage from '../../assets/focusly/focusly_reference.png';
import './FocuslyButton.css';

const FocuslyButton = ({ user }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    setIsChatOpen(true);
  };

  const handleClose = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* Single Focusly AI Button - Hidden when chat is open */}
      {!isChatOpen && (
        <motion.button
          className="focusly-button"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
          aria-label="Open Focusly AI Assistant"
          title="Ask Focusly AI"
        >
          {/* Animated pulse ring */}
          <motion.div
            className="focusly-button-pulse"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Focusly Face Image - Only the face */}
          <img 
            src={focuslyImage} 
            alt="Focusly AI" 
            className="focusly-icon-image"
            draggable="false"
          />

          {/* Desktop Tooltip */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="focusly-tooltip"
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                Ask Focusly AI ✨
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      {/* Focusly AI Chat Modal */}
      <FocuslyAIChat
        currentUser={user}
        isOpen={isChatOpen}
        onClose={handleClose}
      />
    </>
  );
};

export default FocuslyButton;
