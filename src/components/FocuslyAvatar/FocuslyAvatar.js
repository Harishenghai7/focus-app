/**
 * Focusly Avatar Component
 * Displays animated Focusly character with emotion-based animations
 */

import React, { useEffect, useRef, useState } from 'react';
import './FocuslyAvatar.css';

// Animation states (will use Lottie when animations are ready)
const ANIMATION_STATES = {
  idle: 'idle',
  happy: 'happy',
  excited: 'excited',
  sad: 'sad',
  thinking: 'thinking',
  surprised: 'surprised',
  love: 'love',
  confused: 'confused',
  working: 'working',
  sleepy: 'sleepy',
  cool: 'cool',
  waving: 'waving',
  speaking: 'speaking',
};

/**
 * FocuslyAvatar Component
 * @param {string} emotion - Current emotion state
 * @param {boolean} isSpeaking - Is Focusly currently speaking
 * @param {number} size - Avatar size in pixels
 * @param {number} intensity - Animation intensity (0.5 - 1.5)
 */
const FocuslyAvatar = ({ 
  emotion = 'idle', 
  isSpeaking = false, 
  size = 200,
  intensity = 1.0 
}) => {
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const avatarRef = useRef(null);

  // Update animation when emotion or speaking state changes
  useEffect(() => {
    if (isSpeaking) {
      setCurrentAnimation('speaking');
    } else {
      setCurrentAnimation(emotion);
    }
  }, [emotion, isSpeaking]);

  // Get animation class for CSS animations (temporary until Lottie is added)
  const getAnimationClass = () => {
    const baseClass = 'focusly-avatar-animation';
    return `${baseClass} ${baseClass}--${currentAnimation}`;
  };

  // Get intensity style
  const getIntensityStyle = () => {
    return {
      animationDuration: `${2 / intensity}s`,
      transform: `scale(${0.9 + (intensity * 0.1)})`,
    };
  };

  return (
    <div 
      className="focusly-avatar-container" 
      style={{ width: size, height: size }}
      ref={avatarRef}
    >
      <div 
        className={getAnimationClass()}
        style={getIntensityStyle()}
        role="img"
        aria-label={`Focusly feeling ${currentAnimation}`}
      >
        {/* Placeholder: Will be replaced with Lottie animations */}
        <div className="focusly-avatar-placeholder">
          <div className="focusly-face">
            <div className="focusly-eyes">
              <div className={`focusly-eye left ${currentAnimation}`}></div>
              <div className={`focusly-eye right ${currentAnimation}`}></div>
            </div>
            <div className={`focusly-mouth ${currentAnimation}`}>
              {isSpeaking && (
                <div className="speaking-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </div>
          
          {/* Emotion indicator text (for now) */}
          <div className="emotion-label">
            {currentAnimation === 'speaking' ? '🎤 Speaking' : `🦁 ${emotion}`}
          </div>
        </div>
      </div>
      
      {/* Particle effects for special emotions */}
      {currentAnimation === 'excited' && (
        <div className="particles particles--excited">
          <span>✨</span>
          <span>🌟</span>
          <span>⭐</span>
          <span>💫</span>
        </div>
      )}
      
      {currentAnimation === 'love' && (
        <div className="particles particles--love">
          <span>❤️</span>
          <span>💙</span>
          <span>💚</span>
        </div>
      )}
    </div>
  );
};

export default FocuslyAvatar;
