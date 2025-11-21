import React from 'react';

/**
 * FocuslyIcon - AI Companion Lion (Brand Mascot)
 * Cute simplified lion face with blue-purple gradient mane
 * Used for Focusly AI chat and assistance features
 */
const FocuslyIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  filled = true,
  className = '',
  animated = false,
  ...props 
}) => {
  const animationClass = animated ? 'focusly-thinking' : '';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`focus-icon focusly-icon ${animationClass} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="maneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      
      {/* Mane (gradient) */}
      <circle cx="12" cy="12" r="10" fill="url(#maneGradient)" opacity="0.8" />
      
      {/* Face (tan/orange) */}
      <circle cx="12" cy="12.5" r="6.5" fill="#F4A460" />
      
      {/* Left ear */}
      <circle cx="7" cy="6" r="2" fill="url(#maneGradient)" />
      
      {/* Right ear */}
      <circle cx="17" cy="6" r="2" fill="url(#maneGradient)" />
      
      {/* Left eye */}
      <circle cx="10" cy="11" r="1.2" fill="#2C3E50" />
      <circle cx="10.4" cy="10.6" r="0.4" fill="white" />
      
      {/* Right eye */}
      <circle cx="14" cy="11" r="1.2" fill="#2C3E50" />
      <circle cx="14.4" cy="10.6" r="0.4" fill="white" />
      
      {/* Nose */}
      <ellipse cx="12" cy="13.5" rx="1" ry="1.2" fill="#FF69B4" />
      
      {/* Mouth smile */}
      <path 
        d="M10 15 Q12 16 14 15" 
        stroke="#2C3E50" 
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default FocuslyIcon;
