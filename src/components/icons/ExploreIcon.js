import React from 'react';

/**
 * ExploreIcon - Compass outline/filled
 * Used for Explore/Discover tab
 */
const ExploreIcon = ({ 
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
      className={`focus-icon explore-icon ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 18 12 12 18 6 12 12 6" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
};

export default ExploreIcon;
