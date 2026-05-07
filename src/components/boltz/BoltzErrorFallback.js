/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BoltzErrorFallback — GOD-LEVEL | H2 Royal Lavender
 * Emergency Fallback with Focusly AI Animation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * When a video fails to load, we show a high-end Glassmorphism placeholder
 * with Focusly AI personality: "Macha, the signal is weak, but the vision is strong."
 */

import React, { useState, useEffect } from 'react';
import styles from './BoltzErrorFallback.module.css';
import { Sparkles, WifiOff, RefreshCw } from 'lucide-react';

const FOCUSLY_MESSAGES = [
    "Macha, the signal is weak, but the vision is strong. Retrying...",
    "The Boltz connection is taking a moment. Hold tight, Macha!",
    "Even the strongest signals need a breather. Trying again...",
    "The Focus servers are meditating. They'll be back shortly!",
    "Loading your content with royal precision...",
];

const BoltzErrorFallback = ({ onRetry, retryCount = 0 }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [showRetry, setShowRetry] = useState(false);

    useEffect(() => {
        // Cycle through Focusly messages every 4 seconds
        const messageInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % FOCUSLY_MESSAGES.length);
        }, 4000);

        // Show retry button after 8 seconds
        const retryTimer = setTimeout(() => {
            setShowRetry(true);
        }, 8000);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(retryTimer);
        };
    }, []);

    const handleRetry = async () => {
        setIsRetrying(true);
        await onRetry?.();
        setTimeout(() => setIsRetrying(false), 1000);
    };

    return (
        <div className={styles.container}>
            {/* Glassmorphism Background Layer */}
            <div className={styles.glassLayer} />

            {/* Animated Particles */}
            <div className={styles.particles}>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.particle}
                        style={{
                            '--delay': `${i * 0.5}s`,
                            '--x': `${Math.random() * 100}%`,
                            '--y': `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

            {/* Focusly AI Avatar */}
            <div className={styles.avatarContainer}>
                <div className={styles.avatarRing}>
                    <div className={styles.avatarInner}>
                        <Sparkles size={32} className={styles.sparkleIcon} />
                    </div>
                    {/* Rotating Rings */}
                    <div className={styles.rotatingRing1} />
                    <div className={styles.rotatingRing2} />
                </div>
            </div>

            {/* Connection Status */}
            <div className={styles.statusContainer}>
                <WifiOff size={20} className={styles.statusIcon} />
                <span className={styles.statusText}>Connection Interrupted</span>
            </div>

            {/* Focusly AI Message */}
            <div className={styles.messageContainer}>
                <p className={styles.focuslyMessage} key={messageIndex}>
                    {FOCUSLY_MESSAGES[messageIndex]}
                </p>
            </div>

            {/* Retry Progress */}
            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div className={`${styles.progressFill} ${isRetrying ? styles.animating : ''}`} />
                </div>
                {retryCount > 0 && (
                    <span className={styles.retryCount}>
                        Retry attempt {retryCount}
                    </span>
                )}
            </div>

            {/* Retry Button */}
            {showRetry && (
                <button
                    className={`${styles.retryButton} ${isRetrying ? styles.retrying : ''}`}
                    onClick={handleRetry}
                    disabled={isRetrying}
                >
                    <RefreshCw size={18} className={isRetrying ? styles.spinning : ''} />
                    <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
                </button>
            )}

            {/* Satin Finish Overlay */}
            <div className={styles.satinOverlay} />
        </div>
    );
};

export default BoltzErrorFallback;
