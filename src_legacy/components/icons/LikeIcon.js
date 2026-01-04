import React from 'react';

/**
 * LikeIcon - Heart outline/filled
 * Used for liking posts and comments
 * Red when filled/liked, with optional scale animation
 */
const LikeIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  filled = false,
  className = '',
  strokeWidth = 2,
  animated = false,
  ...props 
}) => {
  const animationClass = animated ? 'like-pop' : '';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? (color === 'currentColor' ? '#FF0000' : color) : 'none'}
      stroke={filled ? 'none' : (color === 'currentColor' ? 'currentColor' : color)}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`focus-icon like-icon ${animationClass} ${className}`}
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
};

export default LikeIcon;
