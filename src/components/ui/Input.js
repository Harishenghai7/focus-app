import React from 'react';
import styles from './Input.module.css';

const Input = ({
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    icon,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.inputWrapper} ${className}`}>
            {icon && <span className={styles.inputIconLeft}>{icon}</span>}
            <input
                type={type}
                className={`${styles.input} ${icon ? styles.inputIcon : ''} ${error ? styles.inputError : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...props}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;
