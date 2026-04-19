import React from 'react';
import MainLayout from './MainLayout';
import styles from './PageShell.module.css';

/**
 * Consistent shell for secondary pages: same nav as rest of app + centered content column.
 */
const PageShell = ({ children, className = '' }) => (
    <MainLayout>
        <div className={`${styles.inner} ${className}`.trim()}>{children}</div>
    </MainLayout>
);

export default PageShell;
