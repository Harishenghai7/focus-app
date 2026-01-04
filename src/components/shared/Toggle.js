import React from 'react';
import styles from './Toggle.module.css';

const Toggle = ({
    checked = false,
    onChange,
    disabled = false,
    label,
    description,
    className = '',
    ...props
}) => {
    const handleKeyDown = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!disabled) {
                onChange(!checked);
            }
        }
    };

    return (
        <div className={`${styles.toggleContainer} ${className}`}>
            {(label || description) && (
                <div className={styles.labelContainer}>
                    {label && <label className={styles.label}>{label}</label>}
                    {description && <span className={styles.description}>{description}</span>}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label || 'Toggle'}
                className={`${styles.toggle} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && onChange(!checked)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                {...props}
            >
                <span className={styles.toggleThumb} />
            </button>
        </div>
    );
};

export default Toggle;
