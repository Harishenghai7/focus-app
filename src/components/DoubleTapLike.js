import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DoubleTapLike.css';

export default function DoubleTapLike({ 
  children, 
  onDoubleTap, 
  className = '',
  disabled = false 
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const tapCountRef = useRef(0);

  const handleTap = (e) => {
    if (disabled) return;

    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 300) {
      // Double tap detected
      tapCountRef.current += 1;
      
      if (tapCountRef.current === 2) {
        // Get tap position relative to the element
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setHeartPosition({ x, y });
        setShowHeart(true);
        
        // Call the double tap handler
        if (onDoubleTap) {
          onDoubleTap(e);
        }
        
        // Reset tap count
        tapCountRef.current = 0;
        
        // Hide heart after animation
        setTimeout(() => {
          setShowHeart(false);
        }, 1000);
      }
    } else {
      // Reset tap count if too much time has passed
      tapCountRef.current = 1;
    }
    
    lastTapRef.current = now;
  };

  return (
    <div 
      className={`double-tap-container ${className}`}
      onClick={handleTap}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {children}
      
      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            className="double-tap-heart"
            initial={{ 
              scale: 0, 
              opacity: 0,
              x: heartPosition.x - 25,
              y: heartPosition.y - 25
            }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0],
              y: heartPosition.y - 75
            }}
            exit={{ 
              scale: 0,
              opacity: 0
            }}
            transition={{ 
              duration: 1,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
            >
              ❤️
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Ripple Effect */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            className="double-tap-ripple"
            initial={{
              scale: 0,
              opacity: 0.3,
              x: heartPosition.x - 50,
              y: heartPosition.y - 50
            }}
            animate={{
              scale: 2,
              opacity: 0
            }}
            exit={{
              scale: 0,
              opacity: 0
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 48, 64, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 5
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}