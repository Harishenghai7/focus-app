import React, { useState, useEffect, useRef } from 'react';
import focuslyImage from '../../assets/focusly/focusly_reference.png';
import './FocuslyAvatar.css';

const FocuslyAvatar = ({ 
  isActive, 
  isSpeaking, 
  emotion = 'neutral',
  size = 'large' // 'small', 'medium', 'large'
}) => {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthScale, setMouthScale] = useState(1);
  const [bodyBounce, setBodyBounce] = useState(0);
  const animationFrameRef = useRef(null);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Speaking animation (mouth movement)
  useEffect(() => {
    if (isSpeaking) {
      let frame = 0;
      const animate = () => {
        frame++;
        // Simulate mouth movement with sine wave
        const scale = 1 + Math.sin(frame * 0.3) * 0.5;
        setMouthScale(scale);
        
        // Body bounce
        const bounce = Math.sin(frame * 0.15) * 5;
        setBodyBounce(bounce);
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setMouthScale(1);
        setBodyBounce(0);
      };
    }
  }, [isSpeaking]);

  // Emotion change
  useEffect(() => {
    setCurrentEmotion(emotion);
  }, [emotion]);

  return (
    <div className={`focusly-avatar-wrapper size-${size} ${isActive ? 'active' : ''}`}>
      <div className="focusly-avatar-container">
        {/* Main Avatar Image */}
        <div 
          className={`focusly-avatar-image emotion-${currentEmotion} ${isSpeaking ? 'speaking' : ''}`}
          style={{
            transform: `translateY(${bodyBounce}px)`,
          }}
        >
          <img 
            src={focuslyImage} 
            alt="Focusly" 
            className={`avatar-img ${isBlinking ? 'blinking' : ''}`}
          />
          
          {/* Animated overlay for emotions */}
          <div className={`emotion-overlay emotion-${currentEmotion}`}></div>
          
          {/* Speaking indicator (mouth highlight) */}
          {isSpeaking && (
            <div 
              className="mouth-indicator"
              style={{
                transform: `scale(${mouthScale})`,
              }}
            ></div>
          )}
        </div>
        
        {/* Decorative elements based on emotion */}
        {currentEmotion === 'thinking' && (
          <div className="thinking-bubbles">
            <div className="bubble bubble-1"></div>
            <div className="bubble bubble-2"></div>
            <div className="bubble bubble-3"></div>
          </div>
        )}
        
        {currentEmotion === 'excited' && (
          <div className="sparkles">
            <div className="sparkle sparkle-1">✨</div>
            <div className="sparkle sparkle-2">✨</div>
            <div className="sparkle sparkle-3">✨</div>
            <div className="sparkle sparkle-4">✨</div>
          </div>
        )}
        
        {currentEmotion === 'happy' && (
          <div className="happy-hearts">
            <div className="heart heart-1">💜</div>
            <div className="heart heart-2">💜</div>
          </div>
        )}
        
        {/* Audio visualizer */}
        {isSpeaking && (
          <div className="audio-visualizer">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="visualizer-bar"
                style={{
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        )}
        
        {/* Status indicator */}
        <div className={`status-indicator ${isSpeaking ? 'speaking' : isActive ? 'active' : ''}`}>
          {isSpeaking ? '🎤' : isActive ? '💬' : '😴'}
        </div>
      </div>
    </div>
  );
};

export default FocuslyAvatar;
