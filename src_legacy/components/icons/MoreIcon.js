import React from 'react';

/**
 * MoreIcon - Three dots (horizontal)
 * Used for more options menu
 * Simple and minimal design
 */
const MoreIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  filled = false,
  className = '',
  strokeWidth = 2,
  vertical = false,
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
      className={`focus-icon more-icon ${className}`}
      {...props}
    >
      {vertical ? (
        <>
          <circle cx="12" cy="5" r="1.5" fill={color} />
          <circle cx="12" cy="12" r="1.5" fill={color} />
          <circle cx="12" cy="19" r="1.5" fill={color} />
        </>
      ) : (
        <>
          <circle cx="5" cy="12" r="1.5" fill={color} />
          <circle cx="12" cy="12" r="1.5" fill={color} />
          <circle cx="19" cy="12" r="1.5" fill={color} />
        </>
      )}
    </svg>
  );
};

export default MoreIcon;
