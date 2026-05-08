import React, { useState, useRef, useCallback } from 'react';
import useOAuth from '../../hooks/useOAuth';
import styles from './OAuthButtons.module.css';
import { FaDiscord, FaGithub, FaGoogle, FaMicrosoft, FaTwitter } from 'react-icons/fa';

const OAuthButtons = ({ mode = 'login' }) => {
    const { handleOAuthLogin, loading } = useOAuth();
    const [activeProvider, setActiveProvider] = useState(null);
    const [ripple, setRipple] = useState(null);
    const labelPrefix = mode === 'signup' ? 'Create with' : 'Continue with';

    const providers = [
        { name: 'google', icon: <FaGoogle />, label: `${labelPrefix} Google`, className: styles.google },
        { name: 'azure', icon: <FaMicrosoft />, label: `${labelPrefix} Microsoft`, className: styles.microsoft },
        { name: 'github', icon: <FaGithub />, label: `${labelPrefix} GitHub`, className: styles.github },
        { name: 'discord', icon: <FaDiscord />, label: `${labelPrefix} Discord`, className: styles.discord },
        { name: 'twitter', icon: <FaTwitter />, label: `${labelPrefix} X / Twitter`, className: styles.twitter }
    ];

    const handleClick = useCallback(async (e, provider) => {
        // Ripple effect
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setRipple({ x, y, provider: provider.name });
        setTimeout(() => setRipple(null), 600);

        setActiveProvider(provider.name);
        await handleOAuthLogin(provider.name);
    }, [handleOAuthLogin]);

    return (
        <div className={styles.container}>
            {providers.map((provider, index) => {
                const isActive = activeProvider === provider.name;
                const isLoading = loading && isActive;

                return (
                    <button
                        key={provider.name}
                        className={`${styles.oauthButton} ${provider.className} ${isLoading ? styles.loading : ''}`}
                        onClick={(e) => handleClick(e, provider)}
                        disabled={loading}
                        style={{ animationDelay: `${0.08 * index}s` }}
                        aria-label={provider.label}
                    >
                        {/* Hover gradient sweep */}
                        <span className={styles.hoverSweep} />

                        {/* Neon accent line */}
                        <span className={styles.neonAccent} />

                        {/* Ripple */}
                        {ripple && ripple.provider === provider.name && (
                            <span
                                className={styles.ripple}
                                style={{ left: ripple.x, top: ripple.y }}
                            />
                        )}

                        {/* Icon */}
                        <span className={styles.icon}>
                            {isLoading ? (
                                <span className={styles.spinner} />
                            ) : (
                                provider.icon
                            )}
                        </span>

                        {/* Label */}
                        <span className={styles.label}>{provider.label}</span>

                        {/* Arrow indicator */}
                        <span className={styles.arrow}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default OAuthButtons;
