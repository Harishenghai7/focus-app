import React, { useState } from 'react';
import styles from './TypeSelect.module.css';
import { Image, Video, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPES = [
    {
        id: 'post',
        label: 'Post',
        icon: Image,
        desc: 'Share photos with your followers',
        color: '#8b5cf6',
        pulseColor: 'rgba(139, 92, 246, 0.4)'
    },
    {
        id: 'boltz',
        label: 'Boltz',
        icon: Zap,
        desc: 'Create short, entertaining videos',
        color: '#f59e0b',
        pulseColor: 'rgba(245, 158, 11, 0.4)'
    },
    {
        id: 'flash',
        label: 'Flash',
        icon: Video,
        desc: 'Share moments that disappear',
        color: '#ec4899',
        pulseColor: 'rgba(236, 72, 153, 0.4)'
    }
];

// Haptic feedback function
const triggerHaptic = (intensity = 'light') => {
    if (navigator.vibrate) {
        const pattern = intensity === 'heavy' ? [50, 30, 50] : [20];
        navigator.vibrate(pattern);
    }
};

const TypeSelect = ({ onSelect }) => {
    const [hoveredType, setHoveredType] = useState(null);

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
            <motion.h2
                className={styles.title}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                What do you want to create?
            </motion.h2>

            <div className={styles.grid}>
                {TYPES.map((type, index) => (
                    <motion.button
                        key={type.id}
                        className={styles.sovereignCard}
                        onClick={() => handleSelect(type)}
                        onMouseEnter={() => handleHover(type)}
                        onMouseLeave={() => setHoveredType(null)}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: index * 0.12,
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        whileHover={{
                            scale: 1.03,
                            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {/* Haptic Pulse Ring */}
                        <motion.div
                            className={styles.hapticPulse}
                            animate={{
                                boxShadow: hoveredType === type.id
                                    ? `0 0 0 0 ${type.pulseColor}, 0 0 0 15px transparent, 0 0 0 30px transparent`
                                    : `0 0 0 0 ${type.pulseColor}`
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: hoveredType === type.id ? Infinity : 0,
                                ease: 'easeOut'
                            }}
                        />

                        <div
                            className={styles.iconWrapper}
                            style={{
                                background: `linear-gradient(135deg, ${type.color}20, ${type.color}40)`,
                                borderColor: `${type.color}60`
                            }}
                        >
                            <motion.div
                                animate={{
                                    scale: hoveredType === type.id ? 1.1 : 1,
                                    rotate: hoveredType === type.id ? [0, -5, 5, 0] : 0
                                }}
                                transition={{ duration: 0.4 }}
                            >
                                <type.icon size={32} color={type.color} />
                            </motion.div>
                        </div>

                        <h3 className={styles.label}>{type.label}</h3>
                        <p className={styles.desc}>{type.desc}</p>

                        {/* Selection indicator */}
                        <motion.div
                            className={styles.selectionIndicator}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: hoveredType === type.id ? 1 : 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{ background: type.color }}
                        />
                    </motion.button>
                ))}
            </div>

            {/* Subtle hint text */}
            <motion.p
                className={styles.hint}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                Select a format to begin your creation
            </motion.p>
        </div>
    );
};

export default TypeSelect;
