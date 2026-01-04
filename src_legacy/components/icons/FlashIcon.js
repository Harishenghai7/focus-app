import React from 'react';

/**
 * FlashIcon - Camera flash/Stories
 * Used for Flashes (stories) feature
 * Filled with gradient when active
 */
const FlashIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  filled = false,
  className = '',
  strokeWidth = 2,
  ...props 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'none' : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`focus-icon flash-icon ${className}`}
      {...props}
    >
      {filled ? (
        <>
          <defs>
            <linearGradient id="flashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          <path 
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
            fill="url(#flashGradient)"
          />
        </>
      ) : (
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
      )}
    </svg>
  );
};

export default FlashIcon;
