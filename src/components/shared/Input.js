import React from 'react';
import styles from './Input.module.css';

const Input = ({
    type = 'text',
    name,
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    icon,
    rightElement,
    disabled
}) => {
    return (
        <div className={styles.inputWrapper}>
            <div className={`${styles.inputContainer} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
                {icon && <span className={styles.icon}>{icon}</span>}
                <input
                    type={type}
                    name={name}
                    className={styles.input}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                />
                {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;
