import React from 'react';
import { motion } from 'framer-motion';

/**
 * Text Component - Universal Theme
 * Standardizes body text rendering with cinematic typography
 */
const Text = ({ 
    children, 
    variant = 'primary', 
    size = 'base',
    weight = 'normal',
    className = '', 
    animate = false,
    ...props 
}) => {
    let colorClass = 'var(--text-primary)';
    if (variant === 'secondary') colorClass = 'var(--text-secondary)';
    if (variant === 'tertiary') colorClass = 'var(--text-tertiary)';
    if (variant === 'muted') colorClass = 'var(--text-muted)';
    if (variant === 'faint') colorClass = 'var(--text-faint)';
    
    let baseStyles = {
        color: colorClass,
        fontWeight: `var(--font-${weight})`,
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        fontFamily: 'var(--font-primary)',
        fontSize: `var(--font-${size})`
    };

    if (animate) {
        return (
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={baseStyles} 
                className={className} 
                {...props}
            >
                {children}
            </motion.p>
        );
    }

    return (
        <p style={baseStyles} className={className} {...props}>
            {children}
        </p>
    );
};

export default Text;
