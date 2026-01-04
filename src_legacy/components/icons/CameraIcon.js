import React from 'react';

/**
 * CameraIcon - Camera outline/filled
 * Used for photo capture
 * Modern, DSLR-style
 */
const CameraIcon = ({ 
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
      className={`focus-icon camera-icon ${className}`}
      {...props}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
};

export default CameraIcon;
