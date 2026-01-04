import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ContentWarningPage.module.css';

const ContentWarningPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.icon}>⚠️</div>
            <h1 className={styles.title}>Content Blocked</h1>
            <p className={styles.message}>
                The content you are trying to view or post has been flagged by our moderation system.
                It may violate our community guidelines regarding safety and civility.
            </p>

            <div className={styles.actions}>
                <Link to="/" className={styles.link}>
                    Go Home
                </Link>
                <Link to="/support" className={styles.link}>
                    Contact Support
                </Link>
            </div>
        </div>
    );
};

export default ContentWarningPage;

