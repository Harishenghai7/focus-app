import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import OAuthButtons from '../components/auth/OAuthButtons';
import styles from '../components/auth/Auth.module.css';
import focusLogo from '../assets/focus-logo.png';

const Auth = () => {
    return (
        <AuthLayout>
            <div className={styles.header}>
                <div className={styles.logoMark}>
                    <img src={focusLogo} alt="Focus" className={styles.logoIcon} />
                </div>
                <h2 className={styles.title}>Welcome to Focus</h2>
                <p className={styles.subtitle}>
                    Sign in securely with your preferred account
                </p>
            </div>

            <OAuthButtons />

            <div className={styles.securityNote}>
                <span className={styles.securityIcon}>🔒</span>
                <p className={styles.securityText}>
                    Secured with OAuth 2.0 — your password is never stored with us.
                </p>
            </div>
        </AuthLayout>
    );
};

export default Auth;
