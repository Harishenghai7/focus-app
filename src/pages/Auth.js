import React, { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import OAuthButtons from '../components/auth/OAuthButtons';
import FormDivider from '../components/auth/FormDivider';
import styles from '../components/auth/Auth.module.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <AuthLayout>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className={styles.subtitle}>
                    {isLogin
                        ? 'Enter your details to access your account'
                        : 'Join the community and start creating'}
                </p>
            </div>

            <OAuthButtons />

            <FormDivider text={isLogin ? 'OR LOGIN WITH EMAIL' : 'OR SIGN UP WITH EMAIL'} />

            {isLogin ? <LoginForm /> : <SignupForm />}

            <div className={styles.toggleText}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className={styles.toggleLink}
                >
                    {isLogin ? 'Sign up' : 'Login'}
                </button>
            </div>
        </AuthLayout>
    );
};

export default Auth;
