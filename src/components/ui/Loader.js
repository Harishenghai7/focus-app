import React from 'react';
import styles from './Loader.module.css';

const Loader = ({ size = 'md', className = '' }) => {
    return (
        <div className={`${styles.loader} ${styles[`loader-${size}`]} ${className}`}></div>
    );
};

export default Loader;
