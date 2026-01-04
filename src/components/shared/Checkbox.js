import React from 'react';
import styles from './Checkbox.module.css';

const Checkbox = ({ label, checked, onChange, name, disabled }) => {
    return (
        <label className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className={styles.input}
            />
            <span className={styles.checkmark}></span>
            <span className={styles.label}>{label}</span>
        </label>
    );
};

export default Checkbox;
