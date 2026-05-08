import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';
import CustomIcon from '../CustomIcon/CustomIcon';
import { ROUTES } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Gavel, Heart, Baby, Sparkles, X } from 'lucide-react';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { icon: 'home', path: ROUTES.HOME, label: 'Home' },
        { icon: 'explore', path: ROUTES.EXPLORE, label: 'Explore' },
        { icon: 'video', path: ROUTES.BOLTZ, label: 'Boltz' },
        { icon: 'user', path: ROUTES.PROFILE, label: 'Profile' },
        { icon: 'shield', path: '#pillars', label: 'Safety' },
    ];

    const safetyPillars = [
        { id: 'shield', icon: Shield, label: 'Trust Shield', path: '/trust-shield', color: '#10b981' },
        { id: 'moderator', icon: Gavel, label: 'Moderation', path: '/moderation', color: '#f59e0b' },
        { id: 'support', icon: Heart, label: 'Support', path: '/support', color: '#ef4444' },
        { id: 'teen', icon: Baby, label: 'Teen Care', path: '/teen-care', color: '#8b5cf6' },
        { id: 'focusly', icon: Sparkles, label: 'Focusly AI', path: '/focusly-ai', color: '#06b6d4' },
    ];

    // Handle scroll effect - increases blur when scrolling
    useEffect(() => {
        let rafId = null;
        let lastScrollY = window.scrollY;
        
        const handleScroll = () => {
            if (rafId) return;
            
            rafId = requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const scrolled = currentScrollY > 50;
                
                if (scrolled !== isScrolled && Math.abs(currentScrollY - lastScrollY) > 5) {
                    setIsScrolled(scrolled);
                }
                
                lastScrollY = currentScrollY;
                rafId = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isScrolled]);

    const handleNavClick = (path, special) => {
        if (path === '#pillars') {
            setIsMenuOpen(!isMenuOpen);
            if (navigator.vibrate) navigator.vibrate(15);
            return;
        }

        setIsMenuOpen(false);
        navigate(path);

        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div 
                            className={styles.menuOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div 
                            className={styles.floatingMenu}
                            initial={{ opacity: 0, scale: 0.8, y: 100, x: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 100, x: 50 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        >
                            <div className={styles.menuHeader}>
                                <h3>Sovereign Pillars</h3>
                                <button onClick={() => setIsMenuOpen(false)}><X size={18} /></button>
                            </div>
                            <div className={styles.pillarList}>
                                {safetyPillars.map((pillar) => (
                                    <button 
                                        key={pillar.id}
                                        className={styles.pillarItem}
                                        onClick={() => {
                                            navigate(pillar.path);
                                            setIsMenuOpen(false);
                                        }}
                                        style={{ '--accent': pillar.color }}
                                    >
                                        <div className={styles.pillarIcon}>
                                            <pillar.icon size={22} />
                                        </div>
                                        <span>{pillar.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <nav 
                className={`${styles.bottomNav} ${isScrolled ? styles.scrolled : ''} ${isMenuOpen ? styles.menuActive : ''}`} 
                role="navigation" 
                aria-label="Main navigation"
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.path === '#pillars' ? styles.safetyBtn : ''}`}
                            onClick={() => handleNavClick(item.path, item.special)}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={styles.navIconWrapper}>
                                <CustomIcon
                                    name={item.icon}
                                    size={24}
                                    active={isActive || (item.path === '#pillars' && isMenuOpen)}
                                />
                            </div>
                            {(isActive || (item.path === '#pillars' && isMenuOpen)) && <span className={styles.navLabel}>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Floating Create Button */}
            <button 
                className={styles.floatingCreateBtn}
                onClick={() => navigate(ROUTES.CREATE)}
                aria-label="Create Post"
            >
                <div className={styles.createIconWrapper}>
                    <CustomIcon name="create" size={32} active />
                </div>
            </button>
        </>
    );
};

export default BottomNav;
