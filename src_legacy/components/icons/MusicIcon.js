import React from 'react';

/**
 * MusicIcon - Musical note (double note)
 * Used for adding music to posts/boltz
 * Clean and recognizable
 */
const MusicIcon = ({ 
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
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`focus-icon music-icon ${className}`}
      {...props}
    >
      <path d="M9 18V5l12-2v13a4 4 0 1 1-4 4 4 4 0 0 1 4-4" />
      <circle cx="6" cy="18" r="3" />
    </svg>
  );
};

export default MusicIcon;
