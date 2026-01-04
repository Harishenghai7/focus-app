import React from 'react';

/**
 * SaveIcon - Bookmark outline/filled
 * Used for saving posts
 * Gradient when filled
 */
const SaveIcon = ({ 
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
      className={`focus-icon save-icon ${className}`}
      {...props}
    >
      {filled ? (
        <>
          <defs>
            <linearGradient id="saveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          <path 
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" 
            fill="url(#saveGradient)"
            stroke="none"
          />
          <polyline points="17 21 17 13 7 13 7 21" stroke="white" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
        </>
      )}
    </svg>
  );
};

export default SaveIcon;
