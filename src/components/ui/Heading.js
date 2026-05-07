import React from 'react';
import { motion } from 'framer-motion';

/**
 * Heading Component - Universal Theme
 * Standardizes typography hierarchy (h1-h6) with cinematic rendering
 */
const Heading = ({ 
    level = 2, 
    children, 
    variant = 'primary', 
    gradient = false,
    className = '', 
    animate = false,
    ...props 
}) => {
    const Tag = `h${level}`;
    
    let colorClass = 'var(--text-primary)';
    if (variant === 'secondary') colorClass = 'var(--text-secondary)';
    if (variant === 'muted') colorClass = 'var(--text-muted)';
    
    let baseStyles = {
        color: gradient ? 'transparent' : colorClass,
        fontWeight: 'var(--font-bold)',
        lineHeight: 'var(--leading-tight)',
        letterSpacing: '-0.02em',
        background: gradient ? 'var(--gradient-text)' : 'none',
        WebkitBackgroundClip: gradient ? 'text' : 'unset',
        backgroundClip: gradient ? 'text' : 'unset',
        margin: 0,
        fontFamily: 'var(--font-primary)'
    };

    const sizeMap = {
        1: 'var(--font-4xl)',
        2: 'var(--font-3xl)',
        3: 'var(--font-2xl)',
        4: 'var(--font-xl)',
        5: 'var(--font-lg)',
        6: 'var(--font-base)'
    };
    
    baseStyles.fontSize = sizeMap[level];

    if (animate) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <Tag style={baseStyles} className={className} {...props}>
                    {children}
                </Tag>
            </motion.div>
        );
    }

    return (
        <Tag style={baseStyles} className={className} {...props}>
            {children}
        </Tag>
    );
};

export default Heading;
