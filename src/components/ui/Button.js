import React from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled = false,
    icon,
    ...props
}) => {
    const buttonClass = `
    ${styles.btn} 
    ${styles[`btn-${variant}`]} 
    ${styles[`btn-${size}`]} 
    ${className}
  `;

    return (
        <motion.button
            className={buttonClass}
            disabled={disabled || loading}
            whileHover={!disabled && !loading ? { scale: 1.02 } : { scale: 1 }}
            whileTap={!disabled && !loading ? { scale: 0.94 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...props}
        >
            {loading ? <span className={styles.loader}></span> : icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </motion.button>
    );
};

export default Button;
