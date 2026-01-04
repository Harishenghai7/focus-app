import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css';
import LoginForm from '../../components/auth/LoginForm';

const Login = () => {
    return (
        <div className={styles.authPage}>
            <div className={styles.authBg}></div>

            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <div className={styles.authLogo}>
                        {/* Logo placeholder or component */}
                    </div>
                    <h1 className={styles.authTitle}>Welcome Back</h1>
                    <p className={styles.authSubtitle}>Sign in to continue to Focus</p>
                </div>

                <LoginForm />

                <div className={styles.authFooter}>
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
