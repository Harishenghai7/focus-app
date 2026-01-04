import React from 'react';
import styles from './FloatingButton.module.css';

/**
 * Floating action button component
 * Reusable button for minimize/maximize and other floating actions
 */
const FloatingButton = ({
    icon,
    onClick,
    position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
    size = 'medium', // 'small', 'medium', 'large'
    variant = 'primary', // 'primary', 'secondary', 'ghost'
    pulse = false,
    disabled = false,
    ariaLabel,
    className = '',
    style = {}
}) => {
    const positionClass = styles[position] || styles['top-right'];
    const sizeClass = styles[size] || styles.medium;
    const variantClass = styles[variant] || styles.primary;

    return (
        <button
            className={`
                ${styles.floatingButton}
                ${positionClass}
                ${sizeClass}
                ${variantClass}
                ${pulse ? styles.pulse : ''}
                ${disabled ? styles.disabled : ''}
                ${className}
            `}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            style={style}
        >
            {icon}
        </button>
    );
};

export default FloatingButton;
