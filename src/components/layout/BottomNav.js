import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';
import CustomIcon from '../CustomIcon/CustomIcon';
import { ROUTES } from '../../utils/constants';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: 'home', path: ROUTES.HOME, label: 'Home' },
        { icon: 'explore', path: ROUTES.EXPLORE, label: 'Explore' },
        { icon: 'create', path: ROUTES.CREATE, label: 'Create', special: true },
        { icon: 'boltz', path: ROUTES.BOLTZ, label: 'Boltz' },
        { icon: 'profile', path: ROUTES.PROFILE, label: 'Profile' },
    ];

    const handleNavClick = (path, special) => {
        if (special) {
            // Special handling for create button (could open modal)
            navigate(path);
        } else {
            navigate(path);
        }

        // Haptic feedback (if available)
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <nav className={styles.bottomNav} role="navigation" aria-label="Main navigation">
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
