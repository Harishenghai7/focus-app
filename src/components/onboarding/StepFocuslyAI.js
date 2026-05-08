import React, { useState, useEffect } from 'react';
import styles from './StepFocuslyAI.module.css';
import Button from '../shared/Button';
import { FaRobot, FaComments, FaLightbulb, FaShieldAlt, FaHeart } from 'react-icons/fa';

const PERSONALITIES = [
    { id: 'friendly', name: 'Friendly', emoji: '😊', desc: 'Warm, supportive, and encouraging', color: '#f59e0b', greeting: "Hey! I'm Focusly 👋 I'm here to make your Focus experience amazing. Let's explore together!" },
    { id: 'professional', name: 'Professional', emoji: '💼', desc: 'Direct, efficient, and informative', color: '#3b82f6', greeting: "Welcome to Focus. I'm Focusly, your assistant. I'll help you navigate the platform efficiently." },
    { id: 'playful', name: 'Playful', emoji: '🎉', desc: 'Fun, creative, and energetic', color: '#ec4899', greeting: "Yooo! Focusly here! 🎊 Ready to have a blast on Focus? I've got all the tips and tricks!" },
    { id: 'zen', name: 'Zen', emoji: '🧘', desc: 'Calm, mindful, and balanced', color: '#10b981', greeting: "Namaste. I'm Focusly. I'll be here gently guiding your Focus journey, at your own pace. 🌿" },
];

const PROACTIVITY_LEVELS = [
    { id: 'silent', name: 'Silent', desc: 'Only respond when asked', icon: '🤫' },
    { id: 'gentle', name: 'Gentle', desc: 'Occasional helpful nudges', icon: '🌱' },
    { id: 'active', name: 'Active', desc: 'Regular tips and suggestions', icon: '⚡' },
    { id: 'enthusiastic', name: 'Enthusiastic', desc: 'Always engaged and proactive', icon: '🚀' },
];

const INTERACTION_CHANNELS = [
    { id: 'chatAssist', name: 'Chat assistance', desc: 'Ask Focusly anything', icon: <FaComments /> },
    { id: 'contentSuggestions', name: 'Content suggestions', desc: 'Personalized recommendations', icon: <FaLightbulb /> },
    { id: 'safetyAlerts', name: 'Safety alerts', desc: 'Trust & security notifications', icon: <FaShieldAlt /> },
    { id: 'emotionalCheckin', name: 'Emotional check-ins', desc: 'Wellbeing nudges & support', icon: <FaHeart /> },
];

const StepFocuslyAI = ({ formData, updateFormData, onNext, onBack }) => {
    const ai = formData.focuslyAI || {
        personality: 'friendly',
        proactivity: 'gentle',
        chatAssist: true,
        contentSuggestions: true,
        safetyAlerts: true,
        emotionalCheckin: false,
    };

    const [showGreeting, setShowGreeting] = useState(false);
    const [typedGreeting, setTypedGreeting] = useState('');

    const updateAI = (key, value) => {
        updateFormData('focuslyAI', { ...ai, [key]: value });
    };

    const currentPersonality = PERSONALITIES.find(p => p.id === ai.personality) || PERSONALITIES[0];

    // Typing animation for greeting
    useEffect(() => {
        setShowGreeting(false);
        setTypedGreeting('');
        const showTimer = setTimeout(() => {
            setShowGreeting(true);
            let i = 0;
            const greeting = currentPersonality.greeting;
            const interval = setInterval(() => {
                setTypedGreeting(greeting.slice(0, i + 1));
                i++;
                if (i >= greeting.length) clearInterval(interval);
            }, 25);
            return () => clearInterval(interval);
        }, 300);
        return () => clearTimeout(showTimer);
    }, [ai.personality, currentPersonality.greeting]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Meet Focusly, your AI companion 🤖</h2>
                <p className={styles.subtitle}>
                    Focusly helps you navigate Focus, discover content, stay safe, and maintain digital wellbeing.
                    Customize how it interacts with you.
                </p>
            </div>

            {/* Personality selector */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Personality</label>
                <div className={styles.personalityGrid}>
                    {PERSONALITIES.map(p => (
                        <button
                            key={p.id}
                            className={`${styles.personalityCard} ${ai.personality === p.id ? styles.personalityActive : ''}`}
                            onClick={() => updateAI('personality', p.id)}
                            style={{ '--p-color': p.color }}
                        >
                            <span className={styles.personalityEmoji}>{p.emoji}</span>
                            <strong>{p.name}</strong>
                            <span className={styles.personalityDesc}>{p.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Greeting preview */}
            {showGreeting && (
                <div className={styles.greetingBubble} style={{ '--p-color': currentPersonality.color }}>
                    <div className={styles.greetingAvatar}>
                        <FaRobot />
                    </div>
                    <div className={styles.greetingContent}>
                        <span className={styles.greetingName}>Focusly</span>
                        <p className={styles.greetingText}>{typedGreeting}<span className={styles.cursor}>|</span></p>
                    </div>
                </div>
            )}

            {/* Proactivity level */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>How proactive should Focusly be?</label>
                <div className={styles.proactivityGrid}>
                    {PROACTIVITY_LEVELS.map(level => (
                        <button
                            key={level.id}
                            className={`${styles.proactivityCard} ${ai.proactivity === level.id ? styles.proactivityActive : ''}`}
                            onClick={() => updateAI('proactivity', level.id)}
                        >
                            <span className={styles.proactivityIcon}>{level.icon}</span>
                            <strong>{level.name}</strong>
                            <span>{level.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Interaction channels */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Interaction channels</label>
                <div className={styles.channelList}>
                    {INTERACTION_CHANNELS.map(channel => (
                        <button
                            key={channel.id}
                            className={`${styles.channelRow} ${ai[channel.id] ? styles.channelActive : ''}`}
                            onClick={() => updateAI(channel.id, !ai[channel.id])}
                        >
                            <span className={styles.channelIcon}>{channel.icon}</span>
                            <div className={styles.channelCopy}>
                                <strong>{channel.name}</strong>
                                <span>{channel.desc}</span>
                            </div>
                            <div className={`${styles.toggle} ${ai[channel.id] ? styles.toggleOn : ''}`}>
                                <div className={styles.toggleDot} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button variant="primary" onClick={onNext}>Continue</Button>
            </div>
        </div>
    );
};

export default StepFocuslyAI;
