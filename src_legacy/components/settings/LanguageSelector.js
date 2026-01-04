import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const LanguageSelector = ({ settings, onUpdate, onSuccess }) => {
  const { language, changeLanguage, availableLanguages, t } = useLanguage();

  const regions = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
  ];

  const handleLanguageChange = async (newLanguage) => {
    changeLanguage(newLanguage);
    const success = await onUpdate({ language: newLanguage });
    if (success) {
      onSuccess(`Language changed to ${availableLanguages.find(l => l.code === newLanguage)?.name}`);
    }
  };

  const handleRegionChange = async (newRegion) => {
    const success = await onUpdate({ region: newRegion });
    if (success) {
      onSuccess(`Region changed to ${regions.find(r => r.code === newRegion)?.name}`);
    }
  };

  return (
    <div className="language-selector">
      <h2 className="section-title">{t('language.title')}</h2>

      {/* Language Selection */}
      <div className="settings-group">
        <h3 className="group-title">{t('language.selectLanguage')}</h3>
        
        <div className="language-grid">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              aria-pressed={language === lang.code}
            >
              <div className="language-native">{lang.native}</div>
              <div className="language-english">{lang.name}</div>
              {language === lang.code && (
                <span className="language-check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Region Selection */}
      <div className="settings-group">
        <h3 className="group-title">{t('language.selectRegion')}</h3>
        <p className="group-description">
          Your region affects date formats, time zones, and content recommendations
        </p>
        
        <div className="region-grid">
          {regions.map((region) => (
            <button
              key={region.code}
              className={`region-option ${settings?.region === region.code ? 'active' : ''}`}
              onClick={() => handleRegionChange(region.code)}
              aria-pressed={settings?.region === region.code}
            >
              <span className="region-flag">{region.flag}</span>
              <span className="region-name">{region.name}</span>
              {settings?.region === region.code && (
                <span className="region-check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Format Examples */}
      <div className="settings-group">
        <h3 className="group-title">Format Examples</h3>
        
        <div className="format-examples">
          <div className="format-item">
            <span className="format-label">Date:</span>
            <span className="format-value">
              {new Date().toLocaleDateString(
                language === 'en' ? 'en-US' : 
                language === 'es' ? 'es-ES' :
                language === 'fr' ? 'fr-FR' :
                language === 'de' ? 'de-DE' : 'en-US'
              )}
            </span>
          </div>
          
          <div className="format-item">
            <span className="format-label">Time:</span>
            <span className="format-value">
              {new Date().toLocaleTimeString(
                language === 'en' ? 'en-US' : 
                language === 'es' ? 'es-ES' :
                language === 'fr' ? 'fr-FR' :
                language === 'de' ? 'de-DE' : 'en-US'
              )}
            </span>
          </div>
          
          <div className="format-item">
            <span className="format-label">Number:</span>
            <span className="format-value">
              {(1234567.89).toLocaleString(
                language === 'en' ? 'en-US' : 
                language === 'es' ? 'es-ES' :
                language === 'fr' ? 'fr-FR' :
                language === 'de' ? 'de-DE' : 'en-US'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
