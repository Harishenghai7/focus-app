import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getUserAvatarUrl } from '../../utils/avatarManager';

const Sidebar = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    // Redirect to onboarding if profile is missing (and not loading)
    // Note: We rely on useOnboardingRedirect hook for this mostly, 
    // but this is a secondary check if needed.
    // For now, we'll trust the global hook and just render what we have.

    const navItems = [
        { icon: 'Home', label: 'Home', path: ROUTES.HOME },
        { icon: 'Search', label: 'Explore', path: ROUTES.EXPLORE },
        { icon: 'Video', label: 'Boltz', path: ROUTES.BOLTZ },
        { icon: 'MessageCircle', label: 'Messages', path: ROUTES.MESSAGES },
        { icon: 'Bell', label: 'Notifications', path: ROUTES.NOTIFICATIONS },
        { icon: 'PlusSquare', label: 'Create', path: ROUTES.CREATE },
        { icon: 'User', label: 'Profile', path: ROUTES.PROFILE },
        { icon: 'Settings', label: 'Settings', path: ROUTES.SETTINGS },
    ];

    const handleLogout = async () => {
        await signOut();
        navigate(ROUTES.LOGIN);
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <h1 className="text-gradient">Focus</h1>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.active : ''}`
                        }
                    >
                        <Icon name={item.icon} size={24} />
                        <span className={styles.label}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.footer}>
                {user && (
                    <div className={styles.userProfile}>
                        <Avatar src={getUserAvatarUrl(user, profile)} size="sm" />
                        <div className={styles.userInfo}>
                            <span className={styles.username}>
                                {profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.username || 'User'}
                            </span>
                            <span className={styles.handle}>
                                @{profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user'}
                            </span>
                        </div>
                    </div>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
                    <Icon name="LogOut" size={20} />
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;
