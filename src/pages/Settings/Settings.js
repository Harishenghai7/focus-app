import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useSettings } from '../../hooks/useSettings';
import { useSettingsUpdate } from '../../hooks/useSettingsUpdate';
import useMediaQuery from '../../hooks/useMediaQuery';
import { useAuth } from '../../hooks/useAuth';

/* ── Section Components ─────────────────────────────── */
import AccountSection from '../../components/settings/sections/AccountSection';
import PrivacySection from '../../components/settings/sections/PrivacySection';
import SecuritySection from '../../components/settings/sections/SecuritySection';
import NotificationsSection from '../../components/settings/sections/NotificationsSection';
import TeenCareSection from '../../components/settings/sections/TeenCareSection';
import TrustShieldSection from '../../components/settings/sections/TrustShieldSection';
import ContentPreferencesSection from '../../components/settings/sections/ContentPreferencesSection';
import AccessibilitySection from '../../components/settings/sections/AccessibilitySection';
import FocuslyAISettingsSection from '../../components/settings/sections/FocuslyAISettingsSection';
import DataControlsSection from '../../components/settings/sections/DataControlsSection';

import styles from './Settings.module.css';

/**
 * ═══════════════════════════════════════════════════════════════
 * SOVEREIGN NEXUS — The Focus Settings Ecosystem
 * 
 * 10 Provinces of Total Control:
 *  1. Account         — Profile, email, username, linked accounts
 *  2. Privacy         — Visibility, blocking, activity status
 *  3. Security        — 2FA, biometrics, password, sessions
 *  4. Notifications   — Push, email, in-app, quiet hours
 *  5. Teen Care       — Parental controls, screen time, safety
 *  6. Trust Shield    — Verification, trust score, identity
 *  7. Content Prefs   — Feed filters, language, theme
 *  8. Accessibility   — Font size, contrast, motion, screen reader
 *  9. Focusly AI      — Mascot behavior, voice, suggestions
 * 10. Data Controls   — Export, deletion, download, GDPR
 * ═══════════════════════════════════════════════════════════════
 */

const PROVINCES = [
    {
        id: 'account',
        label: 'Account',
        icon: '👤',
        description: 'Profile, email & linked accounts',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    },
    {
        id: 'privacy',
        label: 'Privacy',
        icon: '🔒',
        description: 'Visibility, blocking & activity status',
        gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    },
    {
        id: 'security',
        label: 'Security',
        icon: '🛡️',
        description: '2FA, biometrics & session management',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: '🔔',
        description: 'Push, email & quiet hours',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
        id: 'teencare',
        label: 'Teen Care',
        icon: '🫶',
        description: 'Parental controls & screen time',
        gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    },
    {
        id: 'trustshield',
        label: 'Trust Shield',
        icon: '⚡',
        description: 'Verification & identity protection',
        gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
    },
    {
        id: 'content',
        label: 'Content Preferences',
        icon: '🎨',
        description: 'Theme, language & feed filters',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    },
    {
        id: 'accessibility',
        label: 'Accessibility',
        icon: '♿',
        description: 'Font size, contrast & motion',
        gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    },
    {
        id: 'focuslyai',
        label: 'Focusly AI',
        icon: '🤖',
        description: 'AI behavior & suggestions',
        gradient: 'linear-gradient(135deg, #c084fc, #a855f7)',
    },
    {
        id: 'datacontrols',
        label: 'Data Controls',
        icon: '📦',
        description: 'Export, deletion & GDPR',
        gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    },
];

const Settings = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { settings, loading, error, updateSetting } = useSettings();
    const { isSaving } = useSettingsUpdate();
    const [activeProvince, setActiveProvince] = useState(
        location.state?.section || 'account'
    );
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const isMobile = useMediaQuery('(max-width: 1024px)');

    // Filter provinces by search
    const filteredProvinces = useMemo(() => {
        if (!searchQuery.trim()) return PROVINCES;
        const q = searchQuery.toLowerCase();
        return PROVINCES.filter(
            (p) =>
                p.label.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    // Handle province change
    const handleProvinceChange = useCallback(
        (provinceId) => {
            setActiveProvince(provinceId);
            setSidebarOpen(false);
            setSearchQuery('');
            window.history.replaceState(
                { section: provinceId },
                '',
                `/settings${provinceId !== 'account' ? `?section=${provinceId}` : ''}`
            );
        },
        []
    );

    // Sync with location state
    useEffect(() => {
        if (location.state?.section && location.state.section !== activeProvince) {
            setActiveProvince(location.state.section);
        }
    }, [location.state, activeProvince]);

    // Get active province data
    const activeProvinceData = PROVINCES.find((p) => p.id === activeProvince);

    // Handle setting update
    const handleUpdateSetting = useCallback(
        (key, value) => {
            updateSetting(key, value);
        },
        [updateSetting]
    );

    // Render active province content
    const renderProvinceContent = () => {
        const commonProps = {
            settings,
            onUpdateSetting: handleUpdateSetting,
        };

        switch (activeProvince) {
            case 'account':
                return <AccountSection {...commonProps} />;
            case 'privacy':
                return <PrivacySection {...commonProps} />;
            case 'security':
                return <SecuritySection {...commonProps} />;
            case 'notifications':
                return <NotificationsSection {...commonProps} />;
            case 'teencare':
                return <TeenCareSection {...commonProps} />;
            case 'trustshield':
                return <TrustShieldSection {...commonProps} />;
            case 'content':
                return <ContentPreferencesSection {...commonProps} />;
            case 'accessibility':
                return <AccessibilitySection {...commonProps} />;
            case 'focuslyai':
                return <FocuslyAISettingsSection {...commonProps} />;
            case 'datacontrols':
                return <DataControlsSection {...commonProps} />;
            default:
                return <AccountSection {...commonProps} />;
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingPulse}>
                        <div className={styles.loadingRing} />
                    </div>
                    <p className={styles.loadingText}>Initializing Sovereign Nexus…</p>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        console.warn('Settings error (using defaults):', error);
    }

    return (
        <MainLayout>
            <div className={styles.nexusContainer}>
                {/* ═══ Ambient Background ═══ */}
                <div className={styles.ambientOrb} />
                <div className={styles.ambientOrb2} />

                {/* ═══ Mobile Header ═══ */}
                {isMobile && (
                    <div className={styles.mobileHeader}>
                        <button
                            className={styles.menuToggle}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle settings menu"
                        >
                            <span className={styles.menuIcon}>
                                <span />
                                <span />
                                <span />
                            </span>
                        </button>
                        <div className={styles.mobileTitle}>
                            <span className={styles.mobileEmoji}>{activeProvinceData?.icon}</span>
                            <span>{activeProvinceData?.label}</span>
                        </div>
                        {isSaving && (
                            <span className={styles.savingBadge}>Saving…</span>
                        )}
                    </div>
                )}

                {/* ═══ Sidebar ═══ */}
                <aside
                    className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
                >
                    {/* Sidebar Header */}
                    <div className={styles.sidebarHeader}>
                        <h1 className={styles.sidebarTitle}>Settings</h1>
                        <p className={styles.sidebarSubtitle}>
                            Sovereign Nexus
                        </p>
                    </div>

                    {/* Search */}
                    <div className={`${styles.searchContainer} ${searchFocused ? styles.searchFocused : ''}`}>
                        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Search settings…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                        {searchQuery && (
                            <button
                                className={styles.searchClear}
                                onClick={() => setSearchQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Province Navigation */}
                    <nav className={styles.provinceNav}>
                        {filteredProvinces.map((province, index) => (
                            <button
                                key={province.id}
                                className={`${styles.provinceBtn} ${
                                    activeProvince === province.id
                                        ? styles.provinceBtnActive
                                        : ''
                                }`}
                                onClick={() => handleProvinceChange(province.id)}
                                style={{
                                    animationDelay: `${index * 30}ms`,
                                }}
                            >
                                <span
                                    className={styles.provinceDot}
                                    style={{
                                        background:
                                            activeProvince === province.id
                                                ? province.gradient
                                                : 'rgba(255,255,255,0.1)',
                                    }}
                                />
                                <span className={styles.provinceIconWrap}>
                                    {province.icon}
                                </span>
                                <div className={styles.provinceText}>
                                    <span className={styles.provinceLabel}>
                                        {province.label}
                                    </span>
                                    <span className={styles.provinceDesc}>
                                        {province.description}
                                    </span>
                                </div>
                                <svg
                                    className={styles.provinceChevron}
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        ))}

                        {filteredProvinces.length === 0 && (
                            <div className={styles.noResults}>
                                <span>🔍</span>
                                <p>No settings match "{searchQuery}"</p>
                            </div>
                        )}
                    </nav>

                </aside>

                {/* ═══ Mobile Overlay ═══ */}
                {isMobile && sidebarOpen && (
                    <div
                        className={styles.overlay}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ═══ Content Area ═══ */}
                <main className={styles.contentArea}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeProvince}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className={styles.contentInner}
                        >
                            {/* Province Header */}
                            <header className={styles.contentHeader}>
                                <div className={styles.headerLeft}>
                                    <div
                                        className={styles.headerIconWrap}
                                        style={{
                                            background: activeProvinceData?.gradient,
                                        }}
                                    >
                                        <span className={styles.headerEmoji}>
                                            {activeProvinceData?.icon}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className={styles.contentTitle}>
                                            {activeProvinceData?.label}
                                        </h2>
                                        <p className={styles.contentDescription}>
                                            {activeProvinceData?.description}
                                        </p>
                                    </div>
                                </div>
                                {isSaving && !isMobile && (
                                    <span className={styles.savingBadge}>
                                        <span className={styles.savingDot} />
                                        Saving…
                                    </span>
                                )}
                            </header>

                            {/* Province Content */}
                            <div className={styles.provinceContent}>
                                {renderProvinceContent()}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </MainLayout>
    );
};

export default Settings;
