import React, { useState, useEffect, useRef } from 'react';
import { FaClock, FaPalette, FaHeart, FaSeedling } from 'react-icons/fa';
import styles from './WellnessNudge.module.css';

const NUDGE_TYPES = {
    time: { icon: <FaClock />, color: '#f59e0b', title: 'Mindful moment', getMessage: (mins) => `You've been scrolling for ${mins} minutes. A short break can boost creativity and focus.`, cta: 'Take a breath' },
    create: { icon: <FaPalette />, color: '#ec4899', title: 'Create something', message: 'The best feeds are made by people like you. Share something real today.', cta: 'Open Creator' },
    celebrate: { icon: <FaHeart />, color: '#10b981', title: 'Nice work today!', message: 'You engaged thoughtfully with 5+ creators. That\u2019s what Focus is about.', cta: 'Keep going' },
    nature: { icon: <FaSeedling />, color: '#22c55e', title: 'Digital sunset', message: 'The real world misses you. Step outside, breathe, come back refreshed.', cta: 'I will!' },
};

const WellnessNudge = ({ type = 'time', scrollMinutes = 0, onDismiss, onAction }) => {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const timeoutRef = useRef(null);

    const nudge = NUDGE_TYPES[type] || NUDGE_TYPES.time;

    useEffect(() => {
        // Show after a brief delay for entrance animation
        timeoutRef.current = setTimeout(() => setVisible(true), 300);
        return () => clearTimeout(timeoutRef.current);
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        setTimeout(() => onDismiss?.(), 400);
    };

    const handleAction = () => {
        onAction?.();
        handleDismiss();
    };

    if (dismissed) return null;

    const message = type === 'time'
        ? nudge.getMessage(scrollMinutes || 20)
        : nudge.message;

    return (
        <div className={`${styles.container} ${visible ? styles.visible : ''}`} style={{ '--nudge-color': nudge.color }}>
            <div className={styles.iconBubble}>
                {nudge.icon}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{nudge.title}</h3>
                <p className={styles.message}>{message}</p>
            </div>

            <div className={styles.actions}>
                <button className={styles.ctaBtn} onClick={handleAction}>{nudge.cta}</button>
                <button className={styles.dismissBtn} onClick={handleDismiss}>Not now</button>
            </div>
        </div>
    );
};

export default WellnessNudge;
