import React, { useState, useEffect } from 'react';
import { FaFingerprint, FaHeart, FaShieldAlt } from 'react-icons/fa';
import TaglineCarousel from './TaglineCarousel';
import styles from './BrandPanel.module.css';
import focusLogo from '../../assets/focus-logo.png';

const BrandPanel = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger staggered entrance after mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const trustSignals = [
        {
            icon: <FaShieldAlt />,
            label: 'Trust Shield',
            text: 'Identity-aware protection, suspicious login defense, and healthier discovery.'
        },
        {
            icon: <FaFingerprint />,
            label: 'Real humans first',
            text: 'Built to help people meet verified, respectful, and emotionally safer communities.'
        },
        {
            icon: <FaHeart />,
            label: 'Wellbeing by design',
            text: 'Meaningful interaction loops instead of manipulative engagement traps.'
        }
    ];

    return (
        <div className={styles.brandPanel}>
            <div className={styles.backgroundEffect}></div>
            <div className={styles.gridLayer}></div>
            <div className={styles.orbPrimary}></div>
            <div className={styles.orbSecondary}></div>
            <div className={styles.orbTertiary}></div>
            <div className={`${styles.content} ${isVisible ? styles.contentVisible : ''}`}>
                <div className={`${styles.badge} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.1s' }}>
                    <span className={styles.badgeDot} />
                    Focus Ecosystem
                </div>
                <div className={styles.heroBlock}>
                    <div className={`${styles.logoContainer} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.logoGlow}></div>
                        <div className={styles.logoRing}></div>
                        <div className={styles.logoRingOuter}></div>
                        <img src={focusLogo} alt="Focus" className={styles.logoImage} />
                    </div>
                    <div className={styles.copyBlock}>
                        <p className={`${styles.eyebrow} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.3s' }}>
                            Social media reimagined for the future
                        </p>
                        <h1 className={`${styles.logoText} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.4s' }}>
                            Meet the real people, not fake profiles.
                        </h1>
                        <p className={`${styles.description} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.5s' }}>
                            Focus blends premium design, healthier interaction systems, and intelligent trust
                            infrastructure into a social experience that feels warm, safe, and unmistakably modern.
                        </p>
                    </div>
                </div>
                <div className={`${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.6s' }}>
                    <TaglineCarousel />
                </div>
                <div className={styles.signalGrid}>
                    {trustSignals.map((signal, index) => (
                        <article 
                            key={signal.label} 
                            className={`${styles.signalCard} ${isVisible ? styles.animateItem : ''}`}
                            style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                        >
                            <div className={styles.signalIcon}>{signal.icon}</div>
                            <div>
                                <h2 className={styles.signalLabel}>{signal.label}</h2>
                                <p className={styles.signalText}>{signal.text}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandPanel;
