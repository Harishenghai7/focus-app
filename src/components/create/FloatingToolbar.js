import React, { useState, useRef, useCallback } from 'react';
import styles from './FloatingToolbar.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scissors, Image as ImageIcon, Sliders, Type, Sticker,
    Sparkles, Layers, Subtitles, ImagePlus, ChevronDown, ChevronUp, GripHorizontal
} from 'lucide-react';

const TOOLS = [
    { id: 'trim', icon: Scissors, label: 'Trim', modes: ['boltz', 'flash'] },
    { id: 'crop', icon: ImagePlus, label: 'Crop', modes: ['post', 'boltz', 'flash'] },
    { id: 'filter', icon: ImageIcon, label: 'Filters', modes: ['post', 'boltz', 'flash'] },
    { id: 'adjust', icon: Sliders, label: 'Adjust', modes: ['post', 'boltz', 'flash'] },
    { id: 'effects', icon: Sparkles, label: 'Effects', modes: ['boltz', 'flash'] },
    { id: 'transitions', icon: Layers, label: 'Transitions', modes: ['boltz'] },
    { id: 'text', icon: Type, label: 'Text', modes: ['post', 'boltz', 'flash'] },
    { id: 'sticker', icon: Sticker, label: 'Stickers', modes: ['boltz', 'flash'] },
    { id: 'subtitles', icon: Subtitles, label: 'Subtitles', modes: ['boltz', 'flash'] },
];

const FloatingToolbar = ({ activeTab, onTabChange, mode = 'post', className = '' }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toolbarRef = useRef(null);

    const filteredTools = TOOLS.filter(tool => tool.modes.includes(mode));

    const handleToolClick = useCallback((toolId) => {
        onTabChange(toolId);
    }, [onTabChange]);

    return (
        <motion.div
            ref={toolbarRef}
            className={`${styles.toolbar} ${isCollapsed ? styles.collapsed : ''} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Collapse toggle */}
            <button
                className={styles.collapseBtn}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
            >
                {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Tools */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        className={styles.toolsRow}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {filteredTools.map((tool, index) => {
                            const isActive = activeTab === tool.id;
                            return (
                                <motion.button
                                    key={tool.id}
                                    className={`${styles.toolBtn} ${isActive ? styles.toolActive : ''}`}
                                    onClick={() => handleToolClick(tool.id)}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    title={tool.label}
                                >
                                    <tool.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                                    <span className={styles.toolLabel}>{tool.label}</span>

                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            className={styles.activeIndicator}
                                            layoutId="toolIndicator"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grip indicator */}
            <div className={styles.gripHandle}>
                <GripHorizontal size={14} />
            </div>
        </motion.div>
    );
};

export default FloatingToolbar;
