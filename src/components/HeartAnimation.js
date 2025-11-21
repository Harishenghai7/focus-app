import React, { useState, useEffect } from 'react';
import './HeartAnimation.css';

/**
 * HeartAnimation Component
 * Displays animated floating hearts for likes
 */
const HeartAnimation = React.forwardRef((props, ref) => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    // Generate multiple hearts
    const heartArray = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 80 + 10, // Random position between 10% and 90%
      delay: Math.random() * 0.5, // Random delay up to 0.5s
      duration: 2 + Math.random() * 1 // Random duration between 2-3s
    }));

    setHearts(heartArray);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      setHearts([]);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="heart-animation-container" ref={ref}>
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`
          }}
        >
          <i className="fas fa-heart"></i>
        </div>
      ))}
    </div>
  );
});

HeartAnimation.displayName = 'HeartAnimation';

export default HeartAnimation;
