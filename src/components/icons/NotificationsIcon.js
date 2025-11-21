import React from 'react';

/**
 * NotificationsIcon - Bell outline/filled
 * Used for Notifications panel
 * Can show unread indicator
 */
const NotificationsIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  filled = false,
  className = '',
  strokeWidth = 2,
  hasUnread = false,
  animated = false,
  ...props 
}) => {
  const animationClass = animated ? 'notification-shake' : '';
  
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
      className={`focus-icon notifications-icon ${animationClass} ${className}`}
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      {hasUnread && (
        <>
          <circle cx="18" cy="4" r="2.5" fill="#FF4757" />
        </>
      )}
    </svg>
  );
};

export default NotificationsIcon;
