import React, { useState, useEffect, useMemo } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FocuslyAvatar.module.css';
import { VisemeType } from '../../utils/visemeMapper';

/**
 * Enhanced Focusly Avatar with Lottie Animations
 * Production-ready animated avatar with lip sync support
 */
const FocuslyAvatarLottie = ({
    emotion = 'idle',
    isSpeaking = false,
    currentViseme = VisemeType.NEUTRAL,
    size = 'medium',
    showParticles = false,
    particleType = 'celebration',
    className = ''
}) => {
    const [currentAnimation, setCurrentAnimation] = useState(null);
    const [animationData, setAnimationData] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [fallbackMode, setFallbackMode] = useState(false);

    // Size mapping
    const sizeMap = {
        small: 150,
        medium: 250,
        large: 350
    };

    const avatarSize = sizeMap[size] || sizeMap.medium;

    // Determine which animation to show
    const animationState = useMemo(() => {
        if (isSpeaking) return 'talking';
        return emotion || 'idle';
    }, [emotion, isSpeaking]);

    // Load animation data
    useEffect(() => {
        const loadAnimation = async () => {
            try {
                // Try to load Lottie animation
                const animationModule = await import(
                    `../../assets/animations/focusly-${animationState}.json`
                );

                setAnimationData(animationModule.default);
                setCurrentAnimation(animationState);
                setFallbackMode(false);
            } catch (error) {
                console.warn(`Lottie animation not found: focusly-${animationState}.json, using fallback`);

                // Fallback to sticker-based animation
                setFallbackMode(true);
                setCurrentAnimation(animationState);
            }
        };

        // Only load if animation state changed
        if (animationState !== currentAnimation) {
            setIsTransitioning(true);
            setTimeout(() => {
                loadAnimation();
                setIsTransitioning(false);
            }, 150);
        }
    }, [animationState, currentAnimation]);

    // Get fallback sticker
    const getFallbackSticker = () => {
        const stickerMap = {
            idle: '01_focusly_happy.png',
            talking: '02_focusly_laughing.png',
            happy: '01_focusly_happy.png',
            sad: '03_focusly_sad.png',
            thinking: '07_focusly_thinking.png',
            excited: '11_focusly_excited.png',
            celebrating: '35_focusly_celebrate.png',
            waving: '16_focusly_waving.png',
            listening: '01_focusly_happy.png',
            confused: '15_focusly_confused.png',
            sleepy: '08_focusly_sleepy.png',
            angry: '10_focusly_angry.png'
        };

        const stickerName = stickerMap[animationState] || stickerMap.idle;

        try {
            return require(`../../assets/focusly/stickers/${stickerName}`);
        } catch {
            return null;
        }
    };

    // Particle configurations
    const particleConfigs = {
        celebration: {
            emoji: ['🎉', '🎊', '⭐', '✨', '🎈'],
            count: 20
        },
        love: {
            emoji: ['❤️', '💙', '💜', '💚', '💛'],
            count: 15
        },
        achievement: {
            emoji: ['🏆', '👏', '🌟', '💪', '🔥'],
            count: 12
        },
        sparkle: {
            emoji: ['✨', '💫', '⭐', '🌟'],
            count: 10
        }
    };

    // Lottie options
    const lottieOptions = {
        animationData,
        loop: animationState === 'idle' || animationState === 'thinking',
        autoplay: true,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
            progressiveLoad: true
        }
    };

    // Apply viseme-based transformations (for advanced lip sync)
    const getVisemeTransform = () => {
        if (!isSpeaking) return {};

        const visemeStyles = {
            [VisemeType.MOUTH_OPEN]: { transform: 'scaleY(1.1)' },
            [VisemeType.MOUTH_WIDE]: { transform: 'scaleX(1.1)' },
            [VisemeType.MOUTH_SMILE]: { transform: 'scale(1.05)' },
            [VisemeType.MOUTH_ROUND]: { transform: 'scale(1.08)' },
            [VisemeType.MOUTH_PUCKER]: { transform: 'scaleX(0.95) scaleY(1.05)' },
            [VisemeType.MOUTH_CLOSED]: { transform: 'scaleY(0.98)' },
            [VisemeType.MOUTH_WIDE_OPEN]: { transform: 'scale(1.15)' }
        };

        return visemeStyles[currentViseme] || {};
    };

    return (
        <div className={`${styles.avatarContainer} ${styles[size]} ${className}`}>
            {/* Background Glow */}
            <motion.div
                className={styles.glow}
                animate={{
                    opacity: isSpeaking ? [0.3, 0.6, 0.3] : 0.3,
                    scale: isSpeaking ? [1, 1.1, 1] : 1
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Main Avatar */}
            <motion.div
                className={styles.avatarWrapper}
                style={{ width: avatarSize, height: avatarSize }}
                animate={{
                    ...getVisemeTransform(),
                    opacity: isTransitioning ? 0.3 : 1
                }}
                transition={{ duration: 0.2 }}
            >
                {!fallbackMode && animationData ? (
                    // Lottie Animation
                    <Lottie
                        {...lottieOptions}
                        style={{
                            width: '100%',
                            height: '100%'
                        }}
                    />
                ) : (
                    // Fallback Sticker
                    <motion.img
                        src={getFallbackSticker()}
                        alt={`Focusly ${animationState}`}
                        className={`${styles.fallbackSticker} ${isSpeaking ? styles.speaking : styles.idle}`}
                        animate={{
                            scale: isSpeaking ? [1, 1.02, 1] : 1,
                            rotate: animationState === 'thinking' ? [0, -3, 3, 0] : 0
                        }}
                        transition={{
                            duration: isSpeaking ? 0.3 : 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        draggable={false}
                    />
                )}
            </motion.div>

            {/* Listening Indicator */}
            <AnimatePresence>
                {isSpeaking && (
                    <motion.div
                        className={styles.listeningIndicator}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <motion.div
                            className={styles.soundWave}
                            animate={{
                                scaleY: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Particle Effects */}
            <AnimatePresence>
                {showParticles && (
                    <div className={styles.particleContainer}>
                        {Array.from({ length: particleConfigs[particleType]?.count || 10 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className={styles.particle}
                                initial={{
                                    x: 0,
                                    y: 0,
                                    opacity: 1,
                                    scale: 0
                                }}
                                animate={{
                                    x: Math.random() * 200 - 100,
                                    y: -Math.random() * 200 - 50,
                                    opacity: 0,
                                    scale: [0, 1.5, 1, 0],
                                    rotate: Math.random() * 360
                                }}
                                transition={{
                                    duration: 1.5 + Math.random(),
                                    delay: Math.random() * 0.3,
                                    ease: "easeOut"
                                }}
                            >
                                {particleConfigs[particleType]?.emoji[
                                    Math.floor(Math.random() * particleConfigs[particleType].emoji.length)
                                ]}
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Blinking Effect (for fallback mode) */}
            {fallbackMode && !isSpeaking && (
                <motion.div
                    className={styles.blinkOverlay}
                    animate={{
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        repeatDelay: 3 + Math.random() * 2
                    }}
                />
            )}
        </div>
    );
};

export default FocuslyAvatarLottie;
