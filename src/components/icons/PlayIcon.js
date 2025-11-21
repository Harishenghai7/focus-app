import React from 'react';

/**
 * PlayIcon Component
 * @param {Object} props - Component props
 * @param {number} props.size - Icon size (default: 24)
 * @param {string} props.color - Icon color (default: currentColor)
 * @param {string} props.className - Additional CSS classes
 */
const PlayIcon = ({ size = 24, color = 'currentColor', className = '', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`play-icon ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M8 5.14v13.72L19 12L8 5.14z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PlayIcon;
