import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useLanguage } from '../../hooks/useLanguage';
import { formatTimestamp } from '../../utils/validation';

const HelpAbout = ({ user }) => {
  const { t } = useLanguage();
  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    buildDate: '2024-01-01',
    environment: process.env.NODE_ENV
  });
  const [sessionInfo, setSessionInfo] = useState(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    fetchSessionInfo();
    getDeviceInfo();
  }, []);

  const fetchSessionInfo = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      setSessionInfo(session);
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  const getDeviceInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    setDeviceInfo(info);
  };

  const handleFeedback = () => {
    // Open feedback form or email
    window.open(`mailto:support@focusapp.com?subject=Feedback from ${user?.email}&body=`, '_blank');
  };

  const handleBugReport = () => {
    // Open bug report form or GitHub issues
    const body = `
**Describe the bug:**


**Steps to reproduce:**
1. 
2. 
3. 

**Expected behavior:**


**Device Info:**
- Browser: ${deviceInfo?.userAgent}
- Platform: ${deviceInfo?.platform}
- Screen: ${deviceInfo?.screen?.width}x${deviceInfo?.screen?.height}
- Viewport: ${deviceInfo?.viewport?.width}x${deviceInfo?.viewport?.height}

**User ID:** ${user?.id}
**App Version:** ${appInfo.version}
    `;
    
    window.open(`mailto:bugs@focusapp.com?subject=Bug Report&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleDocumentation = () => {
    window.open('https://docs.focusapp.com', '_blank');
  };

  const handlePrivacyPolicy = () => {
    window.open('https://focusapp.com/privacy', '_blank');
  };

  const handleTermsOfService = () => {
    window.open('https://focusapp.com/terms', '_blank');
  };

  return (
    <div className="help-about">
      <h2 className="section-title">{t('help.title')}</h2>

      {/* App Info */}
      <div className="settings-group">
        <h3 className="group-title">About Focus</h3>
        
        <div className="app-info-card">
          <div className="app-logo">
            <img src="/focus-logo.png" alt="Focus Logo" />
          </div>
          <div className="app-details">
            <h4 className="app-name">Focus</h4>
            <p className="app-tagline">
              A modern social platform for focused conversations
            </p>
            <div className="app-version">
              <span className="version-label">{t('help.version')}:</span>
              <span className="version-number">{appInfo.version}</span>
            </div>
            <div className="app-build">
              <span className="build-label">Build:</span>
              <span className="build-date">{appInfo.buildDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Resources */}
      <div className="settings-group">
        <h3 className="group-title">Help & Resources</h3>
        
        <div className="help-links">
          <button className="help-link-button" onClick={handleDocumentation}>
            <span className="link-icon">📚</span>
            <div className="link-content">
              <div className="link-title">{t('help.documentation')}</div>
              <div className="link-description">Learn how to use Focus</div>
            </div>
            <span className="link-arrow">→</span>
          </button>

          <button className="help-link-button" onClick={handleFeedback}>
            <span className="link-icon">💬</span>
            <div className="link-content">
              <div className="link-title">{t('help.feedback')}</div>
              <div className="link-description">Share your thoughts with us</div>
            </div>
            <span className="link-arrow">→</span>
          </button>

          <button className="help-link-button" onClick={handleBugReport}>
            <span className="link-icon">🐛</span>
            <div className="link-content">
              <div className="link-title">{t('help.reportBug')}</div>
              <div className="link-description">Report a technical issue</div>
            </div>
            <span className="link-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Legal */}
      <div className="settings-group">
        <h3 className="group-title">Legal</h3>
        
        <div className="legal-links">
          <button className="legal-link-button" onClick={handlePrivacyPolicy}>
            <span className="link-icon">🔒</span>
            <span className="link-title">{t('help.privacy')}</span>
            <span className="link-arrow">→</span>
          </button>

          <button className="legal-link-button" onClick={handleTermsOfService}>
            <span className="link-icon">📜</span>
            <span className="link-title">{t('help.terms')}</span>
            <span className="link-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Session & Device Info */}
      <div className="settings-group">
        <button 
          className="toggle-info-button"
          onClick={() => setShowSessionInfo(!showSessionInfo)}
        >
          <span>Session & Device Information</span>
          <span className="toggle-arrow">{showSessionInfo ? '▼' : '▶'}</span>
        </button>

        {showSessionInfo && (
          <div className="info-details">
            <div className="info-section">
              <h4 className="info-title">Session Info</h4>
              {sessionInfo ? (
                <>
                  <div className="info-item">
                    <span className="info-label">User ID:</span>
                    <span className="info-value">{user?.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Sign In:</span>
                    <span className="info-value">
                      {formatTimestamp(sessionInfo?.user?.last_sign_in_at)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Session Expires:</span>
                    <span className="info-value">
                      {formatTimestamp(sessionInfo?.expires_at)}
                    </span>
                  </div>
                </>
              ) : (
                <p>No session information available</p>
              )}
            </div>

            {deviceInfo && (
              <div className="info-section">
                <h4 className="info-title">Device Info</h4>
                <div className="info-item">
                  <span className="info-label">Platform:</span>
                  <span className="info-value">{deviceInfo.platform}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Language:</span>
                  <span className="info-value">{deviceInfo.language}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Screen:</span>
                  <span className="info-value">
                    {deviceInfo.screen.width} × {deviceInfo.screen.height}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Viewport:</span>
                  <span className="info-value">
                    {deviceInfo.viewport.width} × {deviceInfo.viewport.height}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Online:</span>
                  <span className="info-value">{deviceInfo.onLine ? 'Yes' : 'No'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Cookies:</span>
                  <span className="info-value">{deviceInfo.cookiesEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credits */}
      <div className="settings-group">
        <h3 className="group-title">Credits</h3>
        <div className="credits-card">
          <p className="credits-text">
            Built with ❤️ by the Focus team
          </p>
          <p className="credits-text">
            © 2024 Focus App. All rights reserved.
          </p>
          <div className="social-links">
            <a href="https://twitter.com/focusapp" target="_blank" rel="noopener noreferrer" className="social-link">
              Twitter
            </a>
            <a href="https://github.com/focusapp" target="_blank" rel="noopener noreferrer" className="social-link">
              GitHub
            </a>
            <a href="https://discord.gg/focusapp" target="_blank" rel="noopener noreferrer" className="social-link">
              Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAbout;
