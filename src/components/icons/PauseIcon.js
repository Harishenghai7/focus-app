import React from 'react';

/**
 * PauseIcon Component
 * @param {Object} props - Component props
 * @param {number} props.size - Icon size (default: 24)
 * @param {string} props.color - Icon color (default: currentColor)
 * @param {string} props.className - Additional CSS classes
 */
const PauseIcon = ({ size = 24, color = 'currentColor', className = '', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pause-icon ${className}`}
      aria-hidden="true"
      {...props}
    >
      <rect x="6" y="4" width="4" height="16" fill={color} rx="1" />
      <rect x="14" y="4" width="4" height="16" fill={color} rx="1" />
    </svg>
  );
};

export default PauseIcon;
