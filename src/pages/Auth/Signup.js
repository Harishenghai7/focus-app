import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css';
import SignupForm from '../../components/auth/SignupForm';

const Signup = () => {
    return (
        <div className={styles.authPage}>
            <div className={styles.authBg}></div>

            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <h1 className={styles.authTitle}>Create Account</h1>
                    <p className={styles.authSubtitle}>Join the Focus community today</p>
                </div>

                <SignupForm />

                <div className={styles.authFooter}>
                    Already have an account? <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
