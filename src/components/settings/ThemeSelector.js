import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

const ThemeSelector = ({ settings, onUpdate, onSuccess }) => {
  const { theme, changeTheme, resolvedTheme } = useTheme();
  const { t } = useLanguage();

  const handleThemeChange = async (newTheme) => {
    changeTheme(newTheme);
    const success = await onUpdate({ theme: newTheme });
    if (success) {
      onSuccess(`Theme changed to ${newTheme}`);
    }
  };

  const handleFontSizeChange = async (size) => {
    const success = await onUpdate({ font_size: size });
    if (success) {
      document.documentElement.style.fontSize = 
        size === 'small' ? '14px' :
        size === 'large' ? '18px' : '16px';
      onSuccess(`Font size changed to ${size}`);
    }
  };

  const handleToggle = async (setting, value) => {
    const success = await onUpdate({ [setting]: value });
    if (success) {
      if (setting === 'reduce_motion') {
        document.documentElement.classList.toggle('reduce-motion', value);
      }
      if (setting === 'high_contrast') {
        document.documentElement.classList.toggle('high-contrast', value);
      }
      onSuccess('Setting updated');
    }
  };

  return (
    <div className="theme-selector">
      <h2 className="section-title">{t('theme.title')}</h2>

      {/* Theme Mode */}
      <div className="settings-group">
        <h3 className="group-title">{t('theme.mode')}</h3>
        
        <div className="theme-options">
          <button
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
            aria-pressed={theme === 'light'}
          >
            <div className="theme-preview light-preview">
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-card"></div>
                <div className="preview-card"></div>
              </div>
            </div>
            <div className="theme-label">
              <span className="theme-icon">☀️</span>
              {t('theme.light')}
            </div>
          </button>

          <button
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
            aria-pressed={theme === 'dark'}
          >
            <div className="theme-preview dark-preview">
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-card"></div>
                <div className="preview-card"></div>
              </div>
            </div>
            <div className="theme-label">
              <span className="theme-icon">🌙</span>
              {t('theme.dark')}
            </div>
          </button>

          <button
            className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
            onClick={() => handleThemeChange('auto')}
            aria-pressed={theme === 'auto'}
          >
            <div className="theme-preview auto-preview">
              <div className="preview-split">
                <div className="preview-half light"></div>
                <div className="preview-half dark"></div>
              </div>
            </div>
            <div className="theme-label">
              <span className="theme-icon">🌓</span>
              {t('theme.auto')}
            </div>
          </button>
        </div>

        {theme === 'auto' && (
          <p className="theme-note">
            Currently using <strong>{resolvedTheme}</strong> theme based on your system preferences
          </p>
        )}
      </div>

      {/* Font Size */}
      <div className="settings-group">
        <h3 className="group-title">{t('theme.fontSize')}</h3>
        
        <div className="font-size-options">
          <button
            className={`font-option ${settings?.font_size === 'small' ? 'active' : ''}`}
            onClick={() => handleFontSizeChange('small')}
            aria-pressed={settings?.font_size === 'small'}
          >
            <span className="font-preview small">Aa</span>
            {t('theme.small')}
          </button>

          <button
            className={`font-option ${(!settings?.font_size || settings?.font_size === 'medium') ? 'active' : ''}`}
            onClick={() => handleFontSizeChange('medium')}
            aria-pressed={!settings?.font_size || settings?.font_size === 'medium'}
          >
            <span className="font-preview medium">Aa</span>
            {t('theme.medium')}
          </button>

          <button
            className={`font-option ${settings?.font_size === 'large' ? 'active' : ''}`}
            onClick={() => handleFontSizeChange('large')}
            aria-pressed={settings?.font_size === 'large'}
          >
            <span className="font-preview large">Aa</span>
            {t('theme.large')}
          </button>
        </div>
      </div>

      {/* Accessibility Options */}
      <div className="settings-group">
        <h3 className="group-title">Accessibility</h3>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('theme.highContrast')}</label>
            <p className="field-description">
              Increase contrast for better visibility
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.high_contrast ?? false}
              onChange={(e) => handleToggle('high_contrast', e.target.checked)}
              role="switch"
              aria-checked={settings?.high_contrast ?? false}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('theme.reduceMotion')}</label>
            <p className="field-description">
              Minimize animations and transitions
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.reduce_motion ?? false}
              onChange={(e) => handleToggle('reduce_motion', e.target.checked)}
              role="switch"
              aria-checked={settings?.reduce_motion ?? false}
            />
            <span className="switch-slider"></span>
          </label>
        </div>
      </div>

      {/* Live Preview */}
      <div className="settings-group">
        <h3 className="group-title">Preview</h3>
        <div className="theme-live-preview">
          <div className="preview-card glass">
            <h4>Sample Card</h4>
            <p>This is how your content will look with the current theme settings.</p>
            <button className="preview-button">Sample Button</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
