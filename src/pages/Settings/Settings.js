import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    FaShieldAlt, 
    FaUserLock, 
    FaPalette, 
    FaBell, 
    FaRobot, 
    FaHeadset,
    FaChevronRight,
    FaSignOutAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import AccountSecuritySection from '../../components/settings/AccountSecuritySection';
import PrivacyPillarsSection from '../../components/settings/PrivacyPillarsSection';
import PersonalizationSection from '../../components/settings/PersonalizationSection';
import FocuslyAISection from '../../components/settings/FocuslyAISection';
import SovereignSupportSection from '../../components/settings/SovereignSupportSection';
import { useSettings } from '../../hooks/useSettings';
import { useSettingsUpdate } from '../../hooks/useSettingsUpdate';
import useMediaQuery from '../../hooks/useMediaQuery';
import { useAuth } from '../../hooks/useAuth';
import sovereignStyles from '../../components/settings/SovereignSettings.module.css';
import styles from './Settings.module.css';

/**
 * SOVEREIGN CONTROL CENTER — Settings Architecture
 * 
 * Five Provinces of Control:
 * 1. Account & Security — Trust Shield, Biometrics, Sessions
 * 2. Privacy & Pillars — Teen Care, Content Filter, Blocked Users
 * 3. Personalization — H2 Theme, Notifications, Display
 * 4. Focusly AI — Mascot emotions, Voice/Text preferences
 * 5. Sovereign Support — Tickets, Legal, About h2 innovative
 */

const PROVINCES = [
    { 
        id: 'account', 
        label: 'Account & Security', 
        icon: <FaShieldAlt />,
        description: 'Trust Shield, Biometrics, Sessions',
        iconEmoji: '🛡️'
    },
    { 
        id: 'privacy', 
        label: 'Privacy & Pillars', 
        icon: <FaUserLock />,
        description: 'Teen Care, Content Filter, Blocked Users',
        iconEmoji: '🔒'
    },
    { 
        id: 'personalization', 
        label: 'Personalization', 
        icon: <FaPalette />,
        description: 'H2 Theme, Notifications, Display',
        iconEmoji: '🎨'
    },
    { 
        id: 'focusly', 
        label: 'Focusly AI', 
        icon: <FaRobot />,
        description: 'Mascot settings, Voice & Chat preferences',
        iconEmoji: '🤖'
    },
    { 
        id: 'support', 
        label: 'Sovereign Support', 
        icon: <FaHeadset />,
        description: 'Tickets, Legal, About h2 innovative',
        iconEmoji: '🎧'
    },
];

const Settings = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { settings, loading, error, updateSetting } = useSettings();
    const { isSaving } = useSettingsUpdate();
    const [activeProvince, setActiveProvince] = useState(location.state?.section || 'account');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width: 1024px)');

    // Handle province change
    const handleProvinceChange = useCallback((provinceId) => {
        setActiveProvince(provinceId);
        setSidebarOpen(false);
        
        // Update URL without navigation
        window.history.replaceState(
            { section: provinceId }, 
            '', 
            `/settings${provinceId !== 'account' ? `?section=${provinceId}` : ''}`
        );
    }, []);

    // Sync with location state
    useEffect(() => {
        if (location.state?.section && location.state.section !== activeProvince) {
            setActiveProvince(location.state.section);
        }
    }, [location.state, activeProvince]);

    // Get active province data
    const activeProvinceData = PROVINCES.find(p => p.id === activeProvince);

    // Handle setting update with toast
    const handleUpdateSetting = useCallback((key, value) => {
        updateSetting(key, value);
    }, [updateSetting]);

    // Render active province content
    const renderProvinceContent = () => {
        switch (activeProvince) {
            case 'account':
                return (
                    <AccountSecuritySection 
                        settings={settings}
                        onUpdateSetting={handleUpdateSetting}
                    />
                );
            case 'privacy':
                return (
                    <PrivacyPillarsSection 
                        settings={settings}
                        onUpdateSetting={handleUpdateSetting}
                    />
                );
            case 'personalization':
                return (
                    <PersonalizationSection 
                        settings={settings}
                        onUpdateSetting={handleUpdateSetting}
                    />
                );
            case 'focusly':
                return (
                    <FocuslyAISection />
                );
            case 'support':
                return (
                    <SovereignSupportSection />
                );
            default:
                return (
                    <AccountSecuritySection 
                        settings={settings}
                        onUpdateSetting={handleUpdateSetting}
                    />
                );
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                    <p className={styles.loadingText}>Loading Sovereign Control Center...</p>
                </div>
            </MainLayout>
        );
    }

    // Even if there's an error, useSettings now returns default settings
    // so we can still show the settings page. Log the error for debugging.
    if (error) {
        console.warn('Settings error (using defaults):', error);
    }

    return (
        <MainLayout>
            <div className={sovereignStyles.sovereignContainer}>
                {/* Mobile Header with Menu Toggle */}
                {isMobile && (
                    <div className={styles.mobileHeader}>
                        <button 
                            className={styles.menuButton}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <span className={styles.provinceEmoji}>{activeProvinceData?.iconEmoji}</span>
                            <span className={styles.provinceName}>{activeProvinceData?.label}</span>
                        </button>
                        {isSaving && (
                            <span className={sovereignStyles.savingIndicator}>Saving...</span>
                        )}
                    </div>
                )}

                {/* Sidebar - Master View */}
                <aside className={`${sovereignStyles.sidebar} ${sidebarOpen ? sovereignStyles.open : ''}`}>
                    <div className={sovereignStyles.sidebarHeader}>
                        <h1 className={sovereignStyles.sidebarTitle}>Sovereign Control</h1>
                        <p className={sovereignStyles.sidebarSubtitle}>Manage your Focus experience</p>
                    </div>

                    <nav className={sovereignStyles.provinceList}>
                        {PROVINCES.map((province) => (
                            <button
                                key={province.id}
                                className={`${sovereignStyles.provinceButton} ${
                                    activeProvince === province.id ? sovereignStyles.active : ''
                                }`}
                                onClick={() => handleProvinceChange(province.id)}
                            >
                                <span className={sovereignStyles.provinceIcon}>
                                    {province.iconEmoji}
                                </span>
                                <span className={sovereignStyles.provinceLabel}>{province.label}</span>
                                <FaChevronRight className={sovereignStyles.provinceChevron} />
                            </button>
                        ))}
                    </nav>

                    {/* Logout Button in Sidebar */}
                    <div className={styles.sidebarFooter}>
                        <button 
                            className={styles.logoutButton}
                            onClick={() => {
                                // Handle logout
                                window.location.href = '/auth';
                            }}
                        >
                            <FaSignOutAlt />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile sidebar */}
                {isMobile && sidebarOpen && (
                    <div 
                        className={styles.sidebarOverlay}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Content Area - Detail View */}
                <main className={sovereignStyles.contentArea}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeProvince}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            {/* Province Header */}
                            <header className={sovereignStyles.contentHeader}>
                                <h2 className={sovereignStyles.contentTitle}>
                                    <span className={styles.headerIcon}>{activeProvinceData?.icon}</span>
                                    {activeProvinceData?.label}
                                </h2>
                                <p className={sovereignStyles.contentDescription}>
                                    {activeProvinceData?.description}
                                </p>
                                {isSaving && !isMobile && (
                                    <span className={sovereignStyles.savingIndicator}>Saving...</span>
                                )}
                            </header>

                            {/* Province Content */}
                            <div className={styles.provinceContent}>
                                {renderProvinceContent()}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Mobile Bottom Navigation */}
                {isMobile && (
                    <nav className={sovereignStyles.mobileNav}>
                        <div className={sovereignStyles.mobileNavItems}>
                            {PROVINCES.slice(0, 4).map((province) => (
                                <button
                                    key={province.id}
                                    className={`${sovereignStyles.mobileNavItem} ${
                                        activeProvince === province.id ? sovereignStyles.active : ''
                                    }`}
                                    onClick={() => handleProvinceChange(province.id)}
                                >
                                    <span className={sovereignStyles.mobileNavIcon}>
                                        {province.iconEmoji}
                                    </span>
                                    <span>{province.label.split(' ')[0]}</span>
                                </button>
                            ))}
                            <button
                                className={`${sovereignStyles.mobileNavItem} ${
                                    activeProvince === 'support' ? sovereignStyles.active : ''
                                }`}
                                onClick={() => handleProvinceChange('support')}
                            >
                                <span className={sovereignStyles.mobileNavIcon}>🎧</span>
                                <span>Support</span>
                            </button>
                        </div>
                    </nav>
                )}
            </div>
        </MainLayout>
    );
};

export default Settings;
