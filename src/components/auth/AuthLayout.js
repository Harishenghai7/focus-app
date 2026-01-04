import React from 'react';
import BrandPanel from './BrandPanel';
import styles from './AuthLayout.module.css';

const AuthLayout = ({ children }) => {
    return (
        <div className={styles.container}>
            <BrandPanel />
            <div className={styles.formPanel}>
                <div className={styles.formContent}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
