import React from 'react';

/**
 * SettingsIcon - Gear/Cog wheel outline/filled
 * Used for settings menu
 * Detailed but clean design
 */
const SettingsIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  filled = false,
  className = '',
  strokeWidth = 2,
  animated = false,
  ...props 
}) => {
  const animationClass = animated ? 'settings-spin' : '';
  
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
      className={`focus-icon settings-icon ${animationClass} ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m2.12-2.12l4.24-4.24M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24" />
    </svg>
  );
};

export default SettingsIcon;
