import React from 'react';
import styles from './EffectsPanel.module.css';
import { motion } from 'framer-motion';
import { Gauge, RotateCcw, Repeat, ArrowLeftRight, Zap } from 'lucide-react';

const SPEED_PRESETS = [
    { value: 0.25, label: '0.25x', desc: 'Ultra Slow' },
    { value: 0.5, label: '0.5x', desc: 'Slow Mo' },
    { value: 0.75, label: '0.75x', desc: 'Slow' },
    { value: 1, label: '1x', desc: 'Normal' },
    { value: 1.5, label: '1.5x', desc: 'Fast' },
    { value: 2, label: '2x', desc: 'Double' },
    { value: 3, label: '3x', desc: 'Triple' },
];

const EFFECT_TOGGLES = [
    {
        id: 'reverse',
        icon: RotateCcw,
        label: 'Reverse',
        desc: 'Play video backwards',
        color: '#ec4899'
    },
    {
        id: 'loop',
        icon: Repeat,
        label: 'Loop',
        desc: 'Seamless loop playback',
        color: '#3b82f6'
    },
    {
        id: 'boomerang',
        icon: ArrowLeftRight,
        label: 'Boomerang',
        desc: 'Forward then reverse',
        color: '#f59e0b'
    },
];

const EffectsPanel = ({ effects = {}, onUpdateEffects }) => {
    const { speed = 1 } = effects;

    const handleSpeedChange = (value) => {
        onUpdateEffects({ speed: value });
    };

    const handleToggle = (key) => {
        onUpdateEffects({ [key]: !effects[key] });
    };

    return (
        <div className={styles.container}>
            {/* Speed Control */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Gauge size={16} />
                    <span>Playback Speed</span>
                    <span className={styles.speedValue}>{speed}x</span>
                </div>

                <div className={styles.speedGrid}>
                    {SPEED_PRESETS.map((preset) => (
                        <motion.button
                            key={preset.value}
                            className={`${styles.speedBtn} ${speed === preset.value ? styles.speedActive : ''}`}
                            onClick={() => handleSpeedChange(preset.value)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className={styles.speedLabel}>{preset.label}</span>
                            <span className={styles.speedDesc}>{preset.desc}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Custom speed slider */}
                <div className={styles.customSpeed}>
                    <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.05"
                        value={speed}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        className={styles.rangeInput}
                    />
                    <div className={styles.rangeLabels}>
                        <span>0.1x</span>
                        <span>1x</span>
                        <span>3x</span>
                    </div>
                </div>
            </div>

            {/* Effect Toggles */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Zap size={16} />
                    <span>Effects</span>
                </div>

                <div className={styles.toggleGrid}>
                    {EFFECT_TOGGLES.map((effect) => {
                        const isActive = effects[effect.id];
                        return (
                            <motion.button
                                key={effect.id}
                                className={`${styles.toggleCard} ${isActive ? styles.toggleActive : ''}`}
                                onClick={() => handleToggle(effect.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    '--effect-color': effect.color,
                                    '--effect-color-dim': `${effect.color}20`
                                }}
                            >
                                <div className={styles.toggleIcon}>
                                    <effect.icon size={22} />
                                </div>
                                <div className={styles.toggleInfo}>
                                    <span className={styles.toggleLabel}>{effect.label}</span>
                                    <span className={styles.toggleDesc}>{effect.desc}</span>
                                </div>
                                <div className={`${styles.toggleSwitch} ${isActive ? styles.switchOn : ''}`}>
                                    <div className={styles.switchThumb} />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EffectsPanel;
