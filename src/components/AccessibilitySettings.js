import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  applyHighContrastMode, 
  removeHighContrastMode, 
  prefersHighContrast,
  watchContrastPreference 
} from '../utils/colorContrast';
import './AccessibilitySettings.css';

export default function AccessibilitySettings({ user }) {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [systemPreference, setSystemPreference] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    
    setHighContrast(savedHighContrast);
    setReducedMotion(savedReducedMotion);
    setFontSize(savedFontSize);
    
    // Check system preference
    const systemPref = prefersHighContrast();
    setSystemPreference(systemPref);
    
    // Apply saved settings
    if (savedHighContrast || systemPref) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      applyHighContrastMode(isDarkMode);
    }
    
    if (savedReducedMotion) {
      document.body.classList.add('reduced-motion');
    }
    
    applyFontSize(savedFontSize);
    
    // Watch for system preference changes
    const cleanup = watchContrastPreference((matches) => {
      setSystemPreference(matches);
      if (matches && !highContrast) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        applyHighContrastMode(isDarkMode);
      }
    });
    
    return cleanup;
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', newValue.toString());
    
    if (newValue) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      applyHighContrastMode(isDarkMode);
    } else {
      removeHighContrastMode();
    }
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('reducedMotion', newValue.toString());
    
    if (newValue) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  };

  const applyFontSize = (size) => {
    const root = document.documentElement;
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    
    root.style.fontSize = sizes[size] || sizes.medium;
  };

  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    applyFontSize(size);
  };

  return (
    <div className="accessibility-settings">
      <h3 className="settings-title">Accessibility Settings</h3>
      
      {systemPreference && (
        <div className="system-preference-notice" role="status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Your system is set to high contrast mode</span>
        </div>
      )}
      
      {/* High Contrast Mode */}
      <div className="setting-item">
        <div className="setting-info">
          <label htmlFor="high-contrast-toggle" className="setting-label">
            High Contrast Mode
          </label>
          <p className="setting-description">
            Increases color contrast for better visibility
          </p>
        </div>
        <button
          id="high-contrast-toggle"
          className={`toggle-switch ${highContrast ? 'active' : ''}`}
          onClick={toggleHighContrast}
          role="switch"
          aria-checked={highContrast}
          aria-label="Toggle high contrast mode"
        >
          <span className="toggle-slider"></span>
        </button>
      </div>

      {/* Reduced Motion */}
      <div className="setting-item">
        <div className="setting-info">
          <label htmlFor="reduced-motion-toggle" className="setting-label">
            Reduce Motion
          </label>
          <p className="setting-description">
            Minimizes animations and transitions
          </p>
        </div>
        <button
          id="reduced-motion-toggle"
          className={`toggle-switch ${reducedMotion ? 'active' : ''}`}
          onClick={toggleReducedMotion}
          role="switch"
          aria-checked={reducedMotion}
          aria-label="Toggle reduced motion"
        >
          <span className="toggle-slider"></span>
        </button>
      </div>

      {/* Font Size */}
      <div className="setting-item">
        <div className="setting-info">
          <label htmlFor="font-size-select" className="setting-label">
            Text Size
          </label>
          <p className="setting-description">
            Adjust text size for better readability
          </p>
        </div>
        <div className="font-size-options" role="radiogroup" aria-label="Text size options">
          {['small', 'medium', 'large', 'xlarge'].map((size) => (
            <button
              key={size}
              className={`font-size-btn ${fontSize === size ? 'active' : ''}`}
              onClick={() => changeFontSize(size)}
              role="radio"
              aria-checked={fontSize === size}
              aria-label={`${size.charAt(0).toUpperCase() + size.slice(1)} text size`}
            >
              {size === 'small' && 'A'}
              {size === 'medium' && 'A'}
              {size === 'large' && 'A'}
              {size === 'xlarge' && 'A'}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Reader Info */}
      <div className="setting-item">
        <div className="setting-info">
          <div className="setting-label">Screen Reader Support</div>
          <p className="setting-description">
            Focus is optimized for screen readers including NVDA, JAWS, and VoiceOver
          </p>
        </div>
      </div>

      {/* Keyboard Navigation Info */}
      <div className="setting-item">
        <div className="setting-info">
          <div className="setting-label">Keyboard Navigation</div>
          <p className="setting-description">
            Press <kbd>?</kbd> to view keyboard shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}
