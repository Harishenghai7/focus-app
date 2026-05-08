import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './SovereignBanner.module.css';

const PARTICLE_COUNT = 24;

const SovereignBanner = ({ bannerUrl, isOwnProfile, onEditBanner }) => {
    const bannerRef = useRef(null);
    const [scrollY, setScrollY] = useState(0);
    const [particles] = useState(() =>
        Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 8 + 6,
            delay: Math.random() * 4,
            opacity: Math.random() * 0.4 + 0.1,
        }))
    );

    const handleScroll = useCallback(() => {
        if (bannerRef.current) {
            const rect = bannerRef.current.getBoundingClientRect();
            setScrollY(-rect.top * 0.35);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return (
        <motion.div
            ref={bannerRef}
            className={styles.banner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Background layer */}
            {bannerUrl ? (
                <div
                    className={styles.bannerImage}
                    style={{
                        backgroundImage: `url(${bannerUrl})`,
                        transform: `translateY(${scrollY}px) scale(1.1)`,
                    }}
                />
            ) : (
                <div className={styles.bannerFallback}>
                    {/* Animated gradient mesh */}
                    <div className={styles.meshLayer} />
                    <div className={styles.meshLayerAlt} />

                    {/* Floating particles */}
                    {particles.map((p) => (
                        <div
                            key={p.id}
                            className={styles.particle}
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                opacity: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Gradient overlays */}
            <div className={styles.gradientBottom} />
            <div className={styles.gradientTop} />
            <div className={styles.vignette} />

            {/* Holographic edge shimmer */}
            <div className={styles.holoEdge} />

            {/* Edit button */}
            {isOwnProfile && (
                <motion.button
                    className={styles.editBtn}
                    onClick={onEditBanner}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Edit banner"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Edit Cover</span>
                </motion.button>
            )}
        </motion.div>
    );
};

export default SovereignBanner;
