import React, { useState } from 'react';
import focuslyImg from '../../assets/focusly/focusly_reference.png';

/**
 * FocuslyLion — The Living Digital Companion
 * Uses the actual reference PNG image with CSS-driven animations
 * for breathing, bobbing, and emotion-based visual effects.
 */
const FocuslyLion = ({
    emotion = 'neutral',
    isSpeaking = false,
    size = null,
    className = ''
}) => {
    const [hovered, setHovered] = useState(false);

    // Emotion-based glow color
    const glowColors = {
        neutral: 'rgba(139, 92, 246, 0.35)',
        happy: 'rgba(250, 204, 21, 0.35)',
        excited: 'rgba(236, 72, 153, 0.35)',
        sad: 'rgba(59, 130, 246, 0.35)',
        thinking: 'rgba(6, 182, 212, 0.35)',
        motivated: 'rgba(249, 115, 22, 0.35)',
        confused: 'rgba(6, 182, 212, 0.35)',
        love: 'rgba(236, 72, 153, 0.35)',
    };

    const glowColor = glowColors[emotion] || glowColors.neutral;

    const containerStyle = {
        position: 'relative',
        width: size || '100%',
        height: size || '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const imgStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        filter: `drop-shadow(0 0 30px ${glowColor})`,
        transition: 'transform 0.3s ease, filter 0.5s ease',
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
        animation: isSpeaking
            ? 'focuslySpeak 0.4s ease-in-out infinite alternate'
            : 'focuslyBreathe 3.5s ease-in-out infinite',
    };

    return (
        <div
            style={containerStyle}
            className={className}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <style>{`
                @keyframes focuslyBreathe {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-6px) scale(1.02); }
                }
                @keyframes focuslySpeak {
                    0% { transform: translateY(0) scale(1); }
                    100% { transform: translateY(-3px) scale(1.03); }
                }
            `}</style>
            <img
                src={focuslyImg}
                alt="Focusly AI Companion"
                style={imgStyle}
                draggable={false}
            />
        </div>
    );
};

export default FocuslyLion;
