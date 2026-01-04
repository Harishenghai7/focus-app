import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountSettings from '../components/settings/AccountSettings';
import PrivacySettings from '../components/settings/PrivacySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import ThemeSelector from '../components/settings/ThemeSelector';
import LanguageSelector from '../components/settings/LanguageSelector';
import HelpAbout from '../components/settings/HelpAbout';
import LogoutButton from '../components/settings/LogoutButton';
import LoadingFallback from '../components/settings/LoadingFallback';
import ErrorMessage from '../components/settings/ErrorMessage';
import SuccessBanner from '../components/settings/SuccessBanner';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import './Settings.css';

const Settings = ({ user, userProfile }) => {
  const navigate = useNavigate();
  const { settings, loading, error, updateSettings, revertSettings, isDirty } = useSettings(user?.id);
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [activeSection, setActiveSection] = useState('account');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (isMobile) {
      const element = document.getElementById(`settings-${section}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 4000);
  };

  const sections = [
    { id: 'account', label: t('settings.account') || 'Account', icon: '👤' },
    { id: 'privacy', label: t('settings.privacy') || 'Privacy', icon: '🔒' },
    { id: 'notifications', label: t('settings.notifications') || 'Notifications', icon: '🔔' },
    { id: 'theme', label: t('settings.theme') || 'Theme', icon: '🎨' },
    { id: 'language', label: t('settings.language') || 'Language', icon: '🌐' },
    { id: 'help', label: t('settings.help') || 'Help & About', icon: '❓' }
  ];

  if (loading && !settings) {
    return <LoadingFallback />;
  }

  if (error && !settings) {
    return (
      <div className="settings-page">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  return (
    <div className={`settings-page theme-${theme}`}>
      <div className="settings-container">
        {/* Header */}
        <header className="settings-header">
          <button 
            className="back-button" 
            onClick={() => navigate(-1)}
            aria-label={t('common.back') || 'Back'}
          >
            <span aria-hidden="true">←</span> {t('common.back') || 'Back'}
          </button>
          <h1 className="settings-title">{t('settings.title') || 'Settings'}</h1>
          {isDirty && (
            <button 
              className="revert-button" 
              onClick={revertSettings}
              aria-label={t('settings.revertChanges') || 'Revert Changes'}
            >
              {t('settings.revert') || 'Revert'}
            </button>
          )}
        </header>

        {/* Success Banner */}
        {showSuccessBanner && (
          <SuccessBanner 
            message={successMessage} 
            onClose={() => setShowSuccessBanner(false)} 
          />
        )}

        <div className="settings-layout">
          {/* Navigation Tabs */}
          <nav className="settings-nav" role="tablist" aria-label="Settings navigation">
            {sections.map(section => (
              <button
                key={section.id}
                role="tab"
                aria-selected={activeSection === section.id}
                aria-controls={`settings-${section.id}`}
                className={`settings-tab ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => handleSectionChange(section.id)}
              >
                <span className="tab-icon" aria-hidden="true">{section.icon}</span>
                <span className="tab-label">{section.label}</span>
              </button>
            ))}
          </nav>

          {/* Settings Sections */}
          <div className="settings-sections">
            <section 
              id="settings-account" 
              className={`settings-card ${activeSection === 'account' ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby="settings-account"
            >
              <h2 className="section-header">
                <span className="section-icon">👤</span>
                {t('settings.account') || 'Account Settings'}
              </h2>
              <AccountSettings 
                user={user}
                settings={settings}
                onUpdate={updateSettings}
                onSuccess={showSuccess}
              />
            </section>

            <section 
              id="settings-privacy" 
              className={`settings-card ${activeSection === 'privacy' ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby="settings-privacy"
            >
              <h2 className="section-header">
                <span className="section-icon">🔒</span>
                {t('settings.privacy') || 'Privacy Settings'}
              </h2>
              <PrivacySettings 
                user={user}
                settings={settings}
                onUpdate={updateSettings}
                onSuccess={showSuccess}
              />
            </section>

            <section 
              id="settings-notifications" 
              className={`settings-card ${activeSection === 'notifications' ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby="settings-notifications"
            >
              <h2 className="section-header">
                <span className="section-icon">🔔</span>
                {t('settings.notifications') || 'Notification Settings'}
              </h2>
              <NotificationSettings 
                user={user}
                settings={settings}
                onUpdate={updateSettings}
                onSuccess={showSuccess}
              />
            </section>

            <section 
              id="settings-theme" 
              className={`settings-card ${activeSection === 'theme' ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby="settings-theme"
            >
              <h2 className="section-header">
                <span className="section-icon">🎨</span>
                {t('settings.theme') || 'Theme & Appearance'}
              </h2>
              <ThemeSelector 
                settings={settings}
                onUpdate={updateSettings}
                onSuccess={showSuccess}
              />
            </section>

            <section 
              id="settings-language" 
              className={`settings-card ${activeSection === 'language' ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby="settings-language"
            >
              <h2 className="section-header">
                <span className="section-icon">🌐</span>
                {t('settings.language') || 'Language & Region'}
              </h2>
              <LanguageSelector 
                settings={settings}
                onUpdate={updateSettings}
                onSuccess={showSuccess}
              />
            </section>

            <section 
              id="settings-help" 
              className={`settings-card ${activeSection === 'help' ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby="settings-help"
            >
              <h2 className="section-header">
                <span className="section-icon">❓</span>
                {t('settings.help') || 'Help & About'}
              </h2>
              <HelpAbout user={user} />
            </section>
          </div>
        </div>

        {/* Logout Button - Sticky on Mobile */}
        <div className="settings-footer">
          <LogoutButton onSuccess={() => navigate('/login')} />
        </div>
      </div>
    </div>
  );
};

export default Settings;
