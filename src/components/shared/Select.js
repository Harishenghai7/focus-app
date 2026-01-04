import React, { useState, useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import styles from './Select.module.css';

const Select = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select an option',
    label,
    description,
    disabled = false,
    className = '',
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useClickOutside(() => setIsOpen(false));

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className={`${styles.selectContainer} ${className}`}>
            {(label || description) && (
                <div className={styles.labelContainer}>
                    {label && <label className={styles.label}>{label}</label>}
                    {description && <span className={styles.description}>{description}</span>}
                </div>
            )}
            <div className={styles.selectWrapper} ref={dropdownRef}>
                <button
                    type="button"
                    className={`${styles.select} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    {...props}
                >
                    <span className={styles.selectedValue}>
                        {selectedOption?.label || placeholder}
                    </span>
                    <svg
                        className={styles.chevron}
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                {isOpen && (
                    <div className={styles.dropdown} role="listbox">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                                onClick={() => handleSelect(option)}
                                role="option"
                                aria-selected={option.value === value}
                            >
                                {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                                <span className={styles.optionLabel}>{option.label}</span>
                                {option.description && (
                                    <span className={styles.optionDescription}>{option.description}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Select;
