import React from 'react';
import styles from './FormDivider.module.css';

const FormDivider = ({ text }) => {
    return (
        <div className={styles.divider}>
            <span className={styles.line}></span>
            <span className={styles.text}>{text}</span>
            <span className={styles.line}></span>
        </div>
    );
};

export default FormDivider;
