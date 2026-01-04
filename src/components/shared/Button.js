import React from 'react';
import styles from './Button.module.css';

const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    onClick,
    disabled,
    isLoading,
    fullWidth
}) => {
    return (
        <button
            type={type}
            className={`${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''}`}
            onClick={onClick}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <span className={styles.loader}></span>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
