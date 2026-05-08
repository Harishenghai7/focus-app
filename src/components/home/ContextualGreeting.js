import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusUser } from '../../context/FocusUserContext';
import { FaPlus, FaCompass, FaEnvelope, FaArrowRight } from 'react-icons/fa';
import styles from './ContextualGreeting.module.css';

const getGreetingData = (hour) => {
    if (hour < 5) return { emoji: '🌙', greeting: 'Burning the midnight oil', mood: 'midnight', tip: 'Remember to rest — your creativity needs sleep too.' };
    if (hour < 12) return { emoji: '☀️', greeting: 'Good morning', mood: 'morning', tip: 'Start your day with intention — create something meaningful.' };
    if (hour < 17) return { emoji: '🌤️', greeting: 'Good afternoon', mood: 'afternoon', tip: 'The best ideas come from curiosity. Explore something new.' };
    if (hour < 21) return { emoji: '🌅', greeting: 'Good evening', mood: 'evening', tip: 'Wind down with content that inspires calm and reflection.' };
    return { emoji: '🌙', greeting: 'Good night', mood: 'night', tip: 'A healthy feed knows when to pause. You\'ve done great today.' };
};

const ContextualGreeting = ({ newPostCount = 0, newFollowerCount = 0 }) => {
    const { user, profile } = useFocusUser();
    const navigate = useNavigate();
    const [typedGreeting, setTypedGreeting] = useState('');
    const [showContent, setShowContent] = useState(false);

    const hour = new Date().getHours();
    const greetingData = useMemo(() => getGreetingData(hour), [hour]);
    const displayName = profile?.full_name || profile?.username || 'Focus Creator';
    const firstName = displayName.split(' ')[0];
    const fullGreeting = `${greetingData.greeting}, ${firstName}`;

    // Typing animation
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setTypedGreeting(fullGreeting.slice(0, i + 1));
            i++;
            if (i >= fullGreeting.length) {
                clearInterval(interval);
                setTimeout(() => setShowContent(true), 200);
            }
        }, 40);
        return () => clearInterval(interval);
    }, [fullGreeting]);

    const hasActivity = newPostCount > 0 || newFollowerCount > 0;

    return (
        <section className={styles.container} data-mood={greetingData.mood}>
            {/* Ambient glow */}
            <div className={styles.ambientOrb} />

            <div className={styles.content}>
                <div className={styles.greetingRow}>
                    <span className={styles.emoji}>{greetingData.emoji}</span>
                    <div>
                        <h1 className={styles.greeting}>
                            {typedGreeting}
                            <span className={styles.cursor}>|</span>
                        </h1>
                        {showContent && (
                            <p className={styles.tip}>{greetingData.tip}</p>
                        )}
                    </div>
                </div>

                {showContent && hasActivity && (
                    <div className={styles.activityPills}>
                        {newPostCount > 0 && (
                            <span className={styles.activityPill}>
                                <span className={styles.pillDot} />
                                {newPostCount} new post{newPostCount > 1 ? 's' : ''} from people you follow
                            </span>
                        )}
                        {newFollowerCount > 0 && (
                            <span className={styles.activityPill}>
                                <span className={`${styles.pillDot} ${styles.pillDotGreen}`} />
                                {newFollowerCount} new follower{newFollowerCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                )}

                {showContent && (
                    <div className={styles.quickActions}>
                        <button className={styles.actionPrimary} onClick={() => navigate('/create')}>
                            <FaPlus /> Create
                        </button>
                        <button className={styles.actionGhost} onClick={() => navigate('/explore')}>
                            <FaCompass /> Explore
                        </button>
                        <button className={styles.actionGhost} onClick={() => navigate('/messages')}>
                            <FaEnvelope /> Messages
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ContextualGreeting;
