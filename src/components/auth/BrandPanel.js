import React, { useState, useEffect, useCallback } from 'react';
import { FaFingerprint, FaHeart, FaShieldAlt } from 'react-icons/fa';
import TaglineCarousel from './TaglineCarousel';
import styles from './BrandPanel.module.css';
import focusLogo from '../../assets/focus-logo.png';

const philosophyQuotes = [
    'Identity is the foundation of trust.',
    'Real connection begins with real people.',
    'Safety is not a feature — it is a principle.',
    'Technology should protect, not exploit.',
    'Authenticity cannot be faked.',
];

const BrandPanel = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [trustCount, setTrustCount] = useState(0);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [quoteVisible, setQuoteVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Animated trust counter
    useEffect(() => {
        if (!isVisible) return;
        const target = 47283;
        const duration = 2200;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            current = Math.min(Math.round(increment * step), target);
            setTrustCount(current);
            if (step >= steps) clearInterval(interval);
        }, duration / steps);

        return () => clearInterval(interval);
    }, [isVisible]);

    // Philosophy quote rotation
    const rotateQuote = useCallback(() => {
        setQuoteVisible(false);
        setTimeout(() => {
            setQuoteIndex(prev => (prev + 1) % philosophyQuotes.length);
            setQuoteVisible(true);
        }, 500);
    }, []);

    useEffect(() => {
        const interval = setInterval(rotateQuote, 6000);
        return () => clearInterval(interval);
    }, [rotateQuote]);

    const trustSignals = [
        {
            icon: <FaShieldAlt />,
            label: 'Trust Shield',
            text: 'Identity-aware protection and suspicious login defense.'
        },
        {
            icon: <FaFingerprint />,
            label: 'Real humans first',
            text: 'Verified communities built on authenticity, not anonymity.'
        },
        {
            icon: <FaHeart />,
            label: 'Wellbeing by design',
            text: 'Meaningful interaction loops instead of engagement traps.'
        }
    ];

    return (
        <div className={styles.brandPanel}>
            {/* Background layers */}
            <div className={styles.backgroundEffect} />
            <div className={styles.gridLayer} />
            <div className={styles.orbPrimary} />
            <div className={styles.orbSecondary} />
            <div className={styles.orbTertiary} />

            <div className={`${styles.content} ${isVisible ? styles.contentVisible : ''}`}>
                {/* Ecosystem badge */}
                <div className={`${styles.badge} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.1s' }}>
                    <span className={styles.badgeDot} />
                    Focus Ecosystem
                </div>

                {/* Hero block */}
                <div className={styles.heroBlock}>
                    <div className={`${styles.logoContainer} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.logoGlow} />
                        <div className={styles.logoRing} />
                        <div className={styles.logoRingOuter} />
                        <div className={styles.logoDNA}>
                            <div className={styles.dnaStrand1} />
                            <div className={styles.dnaStrand2} />
                        </div>
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

                {/* Trust counter */}
                <div className={`${styles.trustCounter} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.55s' }}>
                    <div className={styles.trustCounterNumber}>
                        {trustCount.toLocaleString()}
                    </div>
                    <div className={styles.trustCounterLabel}>verified humans and counting</div>
                </div>

                {/* Tagline carousel */}
                <div className={`${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.6s' }}>
                    <TaglineCarousel />
                </div>

                {/* Philosophy quote */}
                <div className={`${styles.philosophyQuote} ${isVisible ? styles.animateItem : ''}`} style={{ animationDelay: '0.65s' }}>
                    <span className={styles.philosophyIcon}>✦</span>
                    <p className={`${styles.philosophyText} ${quoteVisible ? styles.quoteVisible : styles.quoteHidden}`}>
                        {philosophyQuotes[quoteIndex]}
                    </p>
                </div>

                {/* Trust signals */}
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
