import React, { useState } from 'react';
import styles from './TypeSelect.module.css';
import { Image, Video, Zap, FileText, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrafts } from '../../hooks/useDrafts';

const TYPES = [
    {
        id: 'post',
        label: 'Post',
        icon: Image,
        desc: 'Share photos with your followers',
        subtitle: 'Up to 10 photos • Filters • Captions',
        color: '#8b5cf6',
        colorEnd: '#6d28d9',
        pulseColor: 'rgba(139, 92, 246, 0.4)',
        bgGlow: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        particleColor: '#a78bfa'
    },
    {
        id: 'boltz',
        label: 'Boltz',
        icon: Zap,
        desc: 'Create short, entertaining videos',
        subtitle: '15–60s • Effects • Transitions • Music',
        color: '#f59e0b',
        colorEnd: '#d97706',
        pulseColor: 'rgba(245, 158, 11, 0.4)',
        bgGlow: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
        particleColor: '#fbbf24'
    },
    {
        id: 'flash',
        label: 'Flash',
        icon: Video,
        desc: 'Share moments that disappear in 24h',
        subtitle: 'Photos & Videos • Stickers • Text • Polls',
        color: '#ec4899',
        colorEnd: '#be185d',
        pulseColor: 'rgba(236, 72, 153, 0.4)',
        bgGlow: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
        particleColor: '#f472b6'
    }
];

const triggerHaptic = (intensity = 'light') => {
    if (navigator.vibrate) {
        const pattern = intensity === 'heavy' ? [50, 30, 50] : [20];
        navigator.vibrate(pattern);
    }
};

// Floating particle component
const FloatingParticle = ({ color, delay }) => (
    <motion.div
        className={styles.particle}
        style={{ background: color }}
        initial={{ opacity: 0, y: 20, x: Math.random() * 60 - 30 }}
        animate={{
            opacity: [0, 0.6, 0],
            y: [20, -40, -80],
            x: [Math.random() * 30 - 15, Math.random() * 60 - 30]
        }}
        transition={{
            duration: 3 + Math.random() * 2,
            delay,
            repeat: Infinity,
            ease: 'easeOut'
        }}
    />
);

const TypeSelect = ({ onSelect }) => {
    const [hoveredType, setHoveredType] = useState(null);
    const { getDraft } = useDrafts();

    const draftCounts = {
        post: getDraft('post') ? 1 : 0,
        boltz: getDraft('boltz') ? 1 : 0,
        flash: getDraft('flash') ? 1 : 0
    };

    const handleSelect = (type) => {
        triggerHaptic('heavy');
        onSelect(type.id);
    };

    const handleHover = (type) => {
        if (hoveredType !== type.id) {
            triggerHaptic('light');
            setHoveredType(type.id);
        }
    };

    return (
        <div className={styles.sovereignTypeSelect}>
            {/* Ambient background glow */}
            <div className={styles.ambientLayer}>
                <AnimatePresence>
                    {hoveredType && (
                        <motion.div
                            key={hoveredType}
                            className={styles.ambientGlow}
                            style={{
                                background: TYPES.find(t => t.id === hoveredType)?.bgGlow
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Header */}
            <motion.div
                className={styles.headerSection}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className={styles.headerIcon}>
                    <Sparkles size={24} />
                </div>
                <h2 className={styles.title}>Create Something Amazing</h2>
                <p className={styles.subtitle}>Choose your canvas and bring your vision to life</p>
            </motion.div>

            {/* Cards Grid */}
            <div className={styles.grid}>
                {TYPES.map((type, index) => (
                    <motion.button
                        key={type.id}
                        className={`${styles.sovereignCard} ${hoveredType === type.id ? styles.cardActive : ''}`}
                        onClick={() => handleSelect(type)}
                        onMouseEnter={() => handleHover(type)}
                        onMouseLeave={() => setHoveredType(null)}
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            delay: 0.15 + index * 0.12,
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        whileHover={{
                            scale: 1.04,
                            y: -4,
                            transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {/* Animated gradient border */}
                        <motion.div
                            className={styles.cardBorder}
                            style={{
                                background: `conic-gradient(from 0deg, ${type.color}, ${type.colorEnd}, transparent, ${type.color})`
                            }}
                            animate={hoveredType === type.id ? {
                                rotate: 360
                            } : { rotate: 0 }}
                            transition={{
                                duration: 3,
                                repeat: hoveredType === type.id ? Infinity : 0,
                                ease: 'linear'
                            }}
                        />

                        {/* Card inner content */}
                        <div className={styles.cardInner}>
                            {/* Floating particles on hover */}
                            <div className={styles.particlesContainer}>
                                {hoveredType === type.id && [0, 1, 2, 3, 4].map(i => (
                                    <FloatingParticle
                                        key={i}
                                        color={type.particleColor}
                                        delay={i * 0.3}
                                    />
                                ))}
                            </div>

                            {/* Icon */}
                            <div
                                className={styles.iconWrapper}
                                style={{
                                    '--card-color': type.color,
                                    '--card-color-end': type.colorEnd
                                }}
                            >
                                <motion.div
                                    className={styles.iconInner}
                                    animate={hoveredType === type.id ? {
                                        scale: [1, 1.15, 1],
                                        rotate: [0, -8, 8, 0]
                                    } : {}}
                                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                                >
                                    <type.icon size={32} strokeWidth={1.5} />
                                </motion.div>

                                {/* Icon glow ring */}
                                <motion.div
                                    className={styles.iconGlow}
                                    animate={hoveredType === type.id ? {
                                        opacity: [0.3, 0.6, 0.3],
                                        scale: [1, 1.3, 1]
                                    } : { opacity: 0 }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>

                            {/* Text content */}
                            <h3 className={styles.label}>{type.label}</h3>
                            <p className={styles.desc}>{type.desc}</p>
                            <p className={styles.features}>{type.subtitle}</p>

                            {/* Draft badge */}
                            {draftCounts[type.id] > 0 && (
                                <motion.div
                                    className={styles.draftBadge}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1, type: 'spring', stiffness: 300 }}
                                >
                                    <FileText size={12} />
                                    <span>Draft saved</span>
                                </motion.div>
                            )}

                            {/* Selection arrow indicator */}
                            <motion.div
                                className={styles.selectionIndicator}
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{
                                    scaleX: hoveredType === type.id ? 1 : 0,
                                    opacity: hoveredType === type.id ? 1 : 0
                                }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                style={{ background: `linear-gradient(90deg, ${type.color}, ${type.colorEnd})` }}
                            />
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Hint */}
            <motion.div
                className={styles.hintRow}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <Clock size={14} />
                <span>Your progress is automatically saved</span>
            </motion.div>
        </div>
    );
};

export default TypeSelect;
