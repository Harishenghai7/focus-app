import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { ROUTES } from '../../utils/constants';
import { useFocusUser } from '../../context/FocusUserContext';
import { useFocusIdentity } from '../../context/FocusIdentityContext';



const Sidebar = () => {
    const { user, signOut } = useFocusUser();
    const { avatarUrl, displayName, handle, isVerified } = useFocusIdentity();
    const navigate = useNavigate();

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

    const pillarItems = [
        { icon: 'Shield', label: 'Focus Trust Shield', path: '/trust-shield' },
        { icon: 'Filter', label: 'Focus Content Filter & Moderator', path: '/moderation' },
        { icon: 'Heart', label: 'Focus Report & Support System', path: '/support' },
        { icon: 'Users', label: 'Focus Teen Care', path: '/teen-care' },
        { icon: 'Star', label: 'Focusly AI', path: '/focusly-ai' },
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

                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitle}>Pillars</span>
                    <div className={styles.sectionLine} />
                </div>

                {pillarItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.navItem} ${styles.pillarItem} ${isActive ? styles.active : ''}`
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
                        <Avatar
                            src={avatarUrl}
                            username={handle}
                            fullName={displayName}
                            size="sm"
                            eager
                            isVerified={isVerified}
                        />
                        <div className={styles.userInfo}>
                            <span className={styles.username}>{displayName}</span>
                            <span className={styles.handle}>@{handle}</span>
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

