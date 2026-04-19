import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import SettingsSidebar from '../../components/settings/SettingsSidebar';
import AccountSection from '../../components/settings/AccountSection';
import ProfileSection from '../../components/settings/ProfileSection';
import AppearanceSection from '../../components/settings/AppearanceSection';
import PrivacySection from '../../components/settings/PrivacySection';
import NotificationSection from '../../components/settings/NotificationSection';
import SupportSection from '../../components/settings/SupportSection';
import AboutSection from '../../components/settings/AboutSection';
import LogOutButton from '../../components/settings/LogoutButton';
import SessionManager from '../../components/settings/SessionManager';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useSettings } from '../../hooks/useSettings';
import { useSections } from '../../hooks/useSections';
import useMediaQuery from '../../hooks/useMediaQuery';
import styles from './Settings.module.css';

const SECTIONS = [
    { id: 'account',       label: 'Account',            icon: '👤' },
    { id: 'profile',       label: 'Profile',             icon: '📝' },
    { id: 'appearance',    label: 'Appearance',          icon: '🎨' },
    { id: 'privacy',       label: 'Privacy & Security',  icon: '🔒' },
    { id: 'notifications', label: 'Notifications',       icon: '🔔' },
    { id: 'sessions',      label: 'Sessions & Sign Out', icon: '🔐' },
    { id: 'focusid',       label: 'FocusID & Trust',     icon: '💜' },
    { id: 'support',       label: 'Support',             icon: '❓' },
    { id: 'about',         label: 'About',               icon: 'ℹ️' },
];


const Settings = () => {
    const location = useLocation();
    const { settings, loading, error, updateSetting, saving } = useSettings();
    const { toggleSection, isSectionExpanded } = useSections(SECTIONS.map(s => s.id));
    const [activeSection, setActiveSection] = useState(location.state?.section || 'account');
    const isMobile = useMediaQuery('(max-width: 1024px)');

    useEffect(() => {
        if (location.state?.section) {
            setActiveSection(location.state.section);
        }
    }, [location.state]);

    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);

        // Scroll to section on mobile
        if (isMobile) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                    <p className={styles.loadingText}>Loading settings...</p>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className={styles.errorContainer}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <h2 className={styles.errorTitle}>Failed to load settings</h2>
                    <p className={styles.errorMessage}>{error?.message || String(error)}</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className={styles.settingsPage}>
                {/* Desktop Sidebar */}
                {!isMobile && (
                    <SettingsSidebar
                        activeSection={activeSection}
                        onSectionChange={handleSectionChange}
                        sections={SECTIONS}
                    />
                )}

                {/* Main Content */}
                <div className={styles.settingsContent}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Settings</h1>
                        <p className={styles.subtitle}>Manage your account and preferences</p>
                    </div>

                    <div className={styles.sections}>
                        {activeSection === 'account' && (
                            <AccountSection
                                isExpanded={true}
                                onToggle={toggleSection}
                                settings={settings}
                            />
                        )}

                        {activeSection === 'profile' && (
                            <ProfileSection
                                isExpanded={true}
                                onToggle={toggleSection}
                            />
                        )}

                        {activeSection === 'appearance' && (
                            <AppearanceSection
                                isExpanded={true}
                                onToggle={toggleSection}
                                settings={settings}
                                onUpdateSetting={updateSetting}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'privacy' && (
                            <PrivacySection
                                isExpanded={true}
                                onToggle={toggleSection}
                                settings={settings}
                                onUpdateSetting={updateSetting}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'notifications' && (
                            <NotificationSection
                                isExpanded={true}
                                onToggle={toggleSection}
                                settings={settings}
                                onUpdateSetting={updateSetting}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'sessions' && (
                            <div id="sessions" style={{ padding: '4px 0' }}>
                                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: 16, fontWeight: 700 }}>
                                    🔐 Sessions &amp; Sign Out
                                </h2>
                                <SessionManager />
                            </div>
                        )}

                        {activeSection === 'focusid' && (
                            <div id="focusid" style={{ padding: '4px 0' }}>
                                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: 8, fontWeight: 700 }}>
                                    💜 FocusID &amp; Trust Score
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.55 }}>
                                    "Meet the real people; not the fake profiles"<br />
                                    Build your authenticity score without a government ID.
                                </p>
                                <a
                                    href="/verification/focus-id"
                                    style={{
                                        display: 'block',
                                        padding: '14px 16px',
                                        background: 'linear-gradient(135deg, #7E57C2, #4527A0)',
                                        borderRadius: '14px',
                                        color: '#fff',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        textAlign: 'center',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 4px 20px rgba(126,87,194,0.4)',
                                    }}
                                >
                                    View my FocusID Score →
                                </a>
                            </div>
                        )}

                        {activeSection === 'support' && (

                            <SupportSection
                                isExpanded={true}
                                onToggle={toggleSection}
                            />
                        )}

                        {activeSection === 'about' && (
                            <AboutSection
                                isExpanded={true}
                                onToggle={toggleSection}
                            />
                        )}
                    </div>

                    <LogOutButton />
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
