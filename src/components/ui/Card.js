import React from 'react';
import { motion } from 'framer-motion';
import styles from './Card.module.css';

const Card = ({ 
    children, 
    variant = 'glass', 
    interactive = false,
    padding = 'md',
    className = '', 
    ...props 
}) => {
    
    const cardClass = `
        ${styles.cardBase} 
        ${styles[`variant-${variant}`]} 
        ${styles[`padding-${padding}`]} 
        ${interactive ? styles.interactive : ''}
        ${className}
    `;

    if (interactive) {
        return (
            <motion.div 
                className={cardClass}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                {...props}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <div className={cardClass} {...props}>
            {children}
        </div>
    );
};

export default Card;
