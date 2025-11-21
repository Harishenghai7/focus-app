import React from 'react';

/**
 * MessagesIcon - Chat bubble outline/filled
 * Used for Messages/DMs tab
 * Can show notification indicator
 */
const MessagesIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  filled = false,
  className = '',
  strokeWidth = 2,
  hasNotification = false,
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
      className={`focus-icon messages-icon ${className}`}
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      {hasNotification && (
        <>
          <circle cx="18" cy="5" r="3" fill="#FF4757" />
        </>
      )}
    </svg>
  );
};

export default MessagesIcon;
