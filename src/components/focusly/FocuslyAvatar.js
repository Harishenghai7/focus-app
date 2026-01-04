import React, { useState, useEffect } from 'react';
import styles from './FocuslyAvatar.module.css';
import { getStickerForEmotion } from '../../utils/focuslyStickers';

/**
 * FocuslyAvatar Component
 * Uses high-quality sticker images that match the professional reference design
 * Dynamically changes based on emotion/state
 */
const FocuslyAvatar = ({
    emotion = 'neutral',
    isSpeaking = false,
    size = 'medium',
    className = ''
}) => {
    const [currentSticker, setCurrentSticker] = useState('01_focusly_happy.png');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Map emotions/states to specific stickers
        let stickerName;

        if (isSpeaking) {
            // When speaking, use happy/laughing
            stickerName = '02_focusly_laughing.png';
        } else {
            // Map emotions to stickers
            const emotionMap = {
                'happy': '01_focusly_happy.png',
                'laughing': '02_focusly_laughing.png',
                'sad': '03_focusly_sad.png',
                'crying': '04_focusly_crying.png',
                'love': '05_focusly_love.png',
                'cool': '06_focusly_cool.png',
                'thinking': '07_focusly_thinking.png',
                'sleepy': '08_focusly_sleepy.png',
                'surprised': '09_focusly_shocked.png',
                'shocked': '09_focusly_shocked.png',
                'angry': '10_focusly_angry.png',
                'excited': '11_focusly_excited.png',
                'scared': '12_focusly_scared.png',
                'blushing': '13_focusly_blushing.png',
                'mind_blown': '14_focusly_mind_blown.png',
                'confused': '15_focusly_confused.png',
                'wave': '16_focusly_waving.png',
                'waving': '16_focusly_waving.png',
                'thumbs_up': '17_focusly_thumbs_up.png',
                'neutral': '01_focusly_happy.png', // Default happy
            };

            stickerName = emotionMap[emotion?.toLowerCase()] || getStickerForEmotion(emotion);
        }

        // Trigger transition animation
        if (stickerName !== currentSticker) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentSticker(stickerName);
                setIsAnimating(false);
            }, 150);
        }
    }, [emotion, isSpeaking, currentSticker]);

    // Dynamic classes
    const containerClasses = `
        ${styles.avatarContainer} 
        ${styles[size]} 
        ${className}
    `;

    const stickerClasses = `
        ${styles.sticker}
        ${isSpeaking ? styles.speaking : styles.idle}
        ${isAnimating ? styles.transitioning : ''}
    `;

    // Load sticker
    let stickerSrc;
    try {
        stickerSrc = require(`../../assets/focusly/stickers/${currentSticker}`);
    } catch (err) {
        console.error(`Failed to load sticker: ${currentSticker}`);
        stickerSrc = require(`../../assets/focusly/stickers/01_focusly_happy.png`);
    }

    return (
        <div className={containerClasses}>
            {/* Background Glow */}
            <div className={styles.glow} />

            {/* Sticker Avatar */}
            <img
                src={stickerSrc}
                alt={`Focusly ${emotion}`}
                className={stickerClasses}
                draggable={false}
            />
        </div>
    );
};

export default FocuslyAvatar;
