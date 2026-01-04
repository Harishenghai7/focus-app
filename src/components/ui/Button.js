import React from 'react';
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
        <button
            className={buttonClass}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <span className={styles.loader}></span> : icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
