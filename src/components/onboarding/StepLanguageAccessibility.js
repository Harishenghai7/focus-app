import React from 'react';
import styles from './StepLanguageAccessibility.module.css';
import Button from '../shared/Button';
import { FaGlobe, FaEye, FaFont, FaMoon, FaColumns, FaUniversalAccess } from 'react-icons/fa';

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
];

const THEMES = [
    { id: 'dark', name: 'Dark', desc: 'Default Focus experience', preview: '#0d0719' },
    { id: 'midnight', name: 'Midnight', desc: 'Deeper, richer tones', preview: '#020617' },
    { id: 'amoled', name: 'AMOLED', desc: 'True black for OLED screens', preview: '#000000' },
];

const DENSITIES = [
    { id: 'comfortable', name: 'Comfortable', desc: 'Balanced spacing' },
    { id: 'compact', name: 'Compact', desc: 'See more content' },
    { id: 'spacious', name: 'Spacious', desc: 'Relaxed, breathing room' },
];

const FONT_SIZES = [
    { id: 'small', label: 'S', name: 'Small' },
    { id: 'default', label: 'A', name: 'Default' },
    { id: 'large', label: 'A', name: 'Large' },
    { id: 'xl', label: 'A', name: 'Extra Large' },
];

const StepLanguageAccessibility = ({ formData, updateFormData, onNext, onBack }) => {
    const language = formData.languagePreference || 'en';
    const theme = formData.themePreference || 'dark';
    const density = formData.feedDensity || 'comfortable';
    const a11y = formData.accessibilityPreferences || {
        reducedMotion: false,
        highContrast: false,
        fontSize: 'default',
        screenReader: false,
    };

    const updateA11y = (key, value) => {
        updateFormData('accessibilityPreferences', { ...a11y, [key]: value });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Focus adapts to you 🌍</h2>
                <p className={styles.subtitle}>
                    Set your language, display preferences, and accessibility options. Everything can be changed later in Settings.
                </p>
            </div>

            {/* Language */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}><FaGlobe /> Language</label>
                <div className={styles.languageGrid}>
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            className={`${styles.langCard} ${language === lang.code ? styles.langActive : ''}`}
                            onClick={() => updateFormData('languagePreference', lang.code)}
                        >
                            <span className={styles.langFlag}>{lang.flag}</span>
                            <span className={styles.langName}>{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Theme */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}><FaMoon /> Theme</label>
                <div className={styles.themeGrid}>
                    {THEMES.map(t => (
                        <button
                            key={t.id}
                            className={`${styles.themeCard} ${theme === t.id ? styles.themeActive : ''}`}
                            onClick={() => updateFormData('themePreference', t.id)}
                        >
                            <div className={styles.themePreview} style={{ background: t.preview }}>
                                <div className={styles.themeMiniUI}>
                                    <div className={styles.themeMiniBar} />
                                    <div className={styles.themeMiniLine} />
                                    <div className={styles.themeMiniLine2} />
                                </div>
                            </div>
                            <strong>{t.name}</strong>
                            <span>{t.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Feed density */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}><FaColumns /> Feed density</label>
                <div className={styles.densityGrid}>
                    {DENSITIES.map(d => (
                        <button
                            key={d.id}
                            className={`${styles.densityCard} ${density === d.id ? styles.densityActive : ''}`}
                            onClick={() => updateFormData('feedDensity', d.id)}
                        >
                            <strong>{d.name}</strong>
                            <span>{d.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Font size */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}><FaFont /> Font size</label>
                <div className={styles.fontGrid}>
                    {FONT_SIZES.map((f, i) => (
                        <button
                            key={f.id}
                            className={`${styles.fontCard} ${a11y.fontSize === f.id ? styles.fontActive : ''}`}
                            onClick={() => updateA11y('fontSize', f.id)}
                        >
                            <span className={styles.fontLetter} style={{ fontSize: `${0.85 + i * 0.25}rem` }}>{f.label}</span>
                            <span>{f.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Accessibility toggles */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}><FaUniversalAccess /> Accessibility</label>
                <div className={styles.toggleList}>
                    <ToggleRow
                        icon={<FaEye />}
                        title="Reduced motion"
                        desc="Minimize animations throughout Focus"
                        active={a11y.reducedMotion}
                        onToggle={() => updateA11y('reducedMotion', !a11y.reducedMotion)}
                    />
                    <ToggleRow
                        icon={<FaEye />}
                        title="High contrast"
                        desc="Increase contrast for better visibility"
                        active={a11y.highContrast}
                        onToggle={() => updateA11y('highContrast', !a11y.highContrast)}
                    />
                    <ToggleRow
                        icon={<FaUniversalAccess />}
                        title="Screen reader optimized"
                        desc="Enhanced ARIA labels and focus indicators"
                        active={a11y.screenReader}
                        onToggle={() => updateA11y('screenReader', !a11y.screenReader)}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button variant="primary" onClick={onNext}>Continue</Button>
            </div>
        </div>
    );
};

const ToggleRow = ({ icon, title, desc, active, onToggle }) => (
    <button className={`${styles.toggleRow} ${active ? styles.toggleRowActive : ''}`} onClick={onToggle}>
        <span className={styles.toggleIcon}>{icon}</span>
        <div className={styles.toggleCopy}>
            <strong>{title}</strong>
            <span>{desc}</span>
        </div>
        <div className={`${styles.toggle} ${active ? styles.toggleOn : ''}`}>
            <div className={styles.toggleDot} />
        </div>
    </button>
);

export default StepLanguageAccessibility;
