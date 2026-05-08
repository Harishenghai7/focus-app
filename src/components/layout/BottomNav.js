import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';
import CustomIcon from '../CustomIcon/CustomIcon';
import { ROUTES } from '../../utils/constants';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);

    const navItems = [
        { icon: 'home', path: ROUTES.HOME, label: 'Home' },
        { icon: 'explore', path: ROUTES.EXPLORE, label: 'Explore' },
        { icon: 'shield', path: '#pillars', label: 'Pillars', special: true },
        { icon: 'video', path: ROUTES.BOLTZ, label: 'Boltz' },
        { icon: 'user', path: ROUTES.PROFILE, label: 'Profile' },
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
            // Open the pillar menu instead of navigating
            const event = new CustomEvent('open-pillar-menu');
            window.dispatchEvent(event);
            return;
        }

        if (special) {
            navigate(path);
        } else {
            navigate(path);
        }

        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <nav 
            className={`${styles.bottomNav} ${isScrolled ? styles.scrolled : ''}`} 
            role="navigation" 
            aria-label="Main navigation"
        >
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                    <button
                        key={item.path}
                        className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.special ? styles.special : ''}`}
                        onClick={() => handleNavClick(item.path, item.special)}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <div className={styles.navIconWrapper}>
                            <CustomIcon
                                name={item.icon}
                                size={item.special ? 28 : 24}
                                active={isActive}
                            />
                        </div>
                        {isActive && <span className={styles.navLabel}>{item.label}</span>}
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
