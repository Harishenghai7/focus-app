import React from 'react';
import useOAuth from '../../hooks/useOAuth';
import styles from './OAuthButtons.module.css';
import { FaDiscord, FaGithub, FaGoogle, FaMicrosoft, FaTwitter } from 'react-icons/fa';

const OAuthButtons = ({ mode = 'login' }) => {
    const { handleOAuthLogin, loading } = useOAuth();
    const labelPrefix = mode === 'signup' ? 'Create with' : 'Continue with';

    const providers = [
        { name: 'google', icon: <FaGoogle />, label: `${labelPrefix} Google`, className: styles.google },
        { name: 'azure', icon: <FaMicrosoft />, label: `${labelPrefix} Microsoft`, className: styles.microsoft },
        { name: 'github', icon: <FaGithub />, label: `${labelPrefix} GitHub`, className: styles.github },
        { name: 'discord', icon: <FaDiscord />, label: `${labelPrefix} Discord`, className: styles.discord },
        { name: 'twitter', icon: <FaTwitter />, label: `${labelPrefix} Twitter`, className: styles.twitter }
    ];

    return (
        <div className={styles.container}>
            {providers.map((provider) => (
                <button
                    key={provider.name}
                    className={`${styles.oauthButton} ${provider.className}`}
                    onClick={() => handleOAuthLogin(provider.name)}
                    disabled={loading}
                >
                    <span className={styles.icon}>{provider.icon}</span>
                    <span className={styles.label}>{provider.label}</span>
                </button>
            ))}
        </div>
    );
};

export default OAuthButtons;
