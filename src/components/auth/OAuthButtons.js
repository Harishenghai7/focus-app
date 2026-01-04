import React from 'react';
import useOAuth from '../../hooks/useOAuth';
import styles from './OAuthButtons.module.css';
import { FaGoogle, FaMicrosoft, FaGithub, FaDiscord, FaTwitter } from 'react-icons/fa';

const OAuthButtons = () => {
    const { handleOAuthLogin, loading } = useOAuth();

    const providers = [
        { name: 'google', icon: <FaGoogle />, label: 'Continue with Google', className: styles.google },
        { name: 'azure', icon: <FaMicrosoft />, label: 'Continue with Microsoft', className: styles.microsoft },
        { name: 'github', icon: <FaGithub />, label: 'Continue with GitHub', className: styles.github },
        { name: 'discord', icon: <FaDiscord />, label: 'Continue with Discord', className: styles.discord },
        { name: 'twitter', icon: <FaTwitter />, label: 'Continue with Twitter', className: styles.twitter },
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
