import React from 'react';
import styles from './TransitionsPanel.module.css';
import { motion } from 'framer-motion';
import { Layers, Clock } from 'lucide-react';

const TRANSITIONS = [
    { id: 'none', name: 'None', preview: '—', color: '#6b7280' },
    { id: 'fade', name: 'Fade', preview: '◐', color: '#8b5cf6' },
    { id: 'slide-left', name: 'Slide Left', preview: '◄', color: '#3b82f6' },
    { id: 'slide-right', name: 'Slide Right', preview: '►', color: '#3b82f6' },
    { id: 'slide-up', name: 'Slide Up', preview: '▲', color: '#10b981' },
    { id: 'dissolve', name: 'Dissolve', preview: '✦', color: '#ec4899' },
    { id: 'zoom-in', name: 'Zoom In', preview: '⊕', color: '#f59e0b' },
    { id: 'zoom-out', name: 'Zoom Out', preview: '⊖', color: '#f59e0b' },
    { id: 'wipe', name: 'Wipe', preview: '▬', color: '#14b8a6' },
    { id: 'glitch', name: 'Glitch', preview: '⚡', color: '#ef4444' },
    { id: 'blur', name: 'Blur', preview: '◉', color: '#8b5cf6' },
    { id: 'flash', name: 'Flash', preview: '✴', color: '#fbbf24' },
];

const DURATIONS = [
    { value: 0.3, label: '0.3s' },
    { value: 0.5, label: '0.5s' },
    { value: 0.8, label: '0.8s' },
    { value: 1.0, label: '1.0s' },
    { value: 1.5, label: '1.5s' },
];

const TransitionsPanel = ({ transitions = [], onUpdateTransitions, selectedTransition, onSelectTransition }) => {
    const currentTransition = selectedTransition || 'none';
    const currentDuration = transitions[0]?.duration || 0.5;

    const handleSelect = (transitionId) => {
        if (onSelectTransition) {
            onSelectTransition(transitionId);
        }
        if (onUpdateTransitions) {
            onUpdateTransitions([{
                id: transitionId,
                duration: currentDuration,
                position: 'between'
            }]);
        }
    };

    const handleDurationChange = (duration) => {
        if (onUpdateTransitions) {
            onUpdateTransitions([{
                id: currentTransition,
                duration,
                position: 'between'
            }]);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.sectionHeader}>
                <Layers size={16} />
                <span>Transition Effects</span>
            </div>

            {/* Transitions Grid */}
            <div className={styles.transitionGrid}>
                {TRANSITIONS.map((transition) => {
                    const isActive = currentTransition === transition.id;
                    return (
                        <motion.button
                            key={transition.id}
                            className={`${styles.transitionCard} ${isActive ? styles.cardActive : ''}`}
                            onClick={() => handleSelect(transition.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ '--t-color': transition.color }}
                        >
                            <div className={styles.transitionPreview}>
                                <span>{transition.preview}</span>
                            </div>
                            <span className={styles.transitionName}>{transition.name}</span>
                            {isActive && (
                                <motion.div
                                    className={styles.activeRing}
                                    layoutId="transitionActive"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Duration Control */}
            {currentTransition !== 'none' && (
                <motion.div
                    className={styles.durationSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.sectionHeader}>
                        <Clock size={14} />
                        <span>Duration</span>
                        <span className={styles.durationValue}>{currentDuration}s</span>
                    </div>

                    <div className={styles.durationRow}>
                        {DURATIONS.map((d) => (
                            <button
                                key={d.value}
                                className={`${styles.durationBtn} ${currentDuration === d.value ? styles.durationActive : ''}`}
                                onClick={() => handleDurationChange(d.value)}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={currentDuration}
                        onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
                        className={styles.rangeInput}
                    />
                </motion.div>
            )}
        </div>
    );
};

export default TransitionsPanel;
