import React from 'react';
import SettingsSection from './SettingsSection';
import styles from './AboutSection.module.css';

const AboutSection = ({ isExpanded, onToggle }) => {
    const icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    return (
        <SettingsSection
            id="about"
            title="About Focus"
            description="App information and credits"
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <div className={styles.logoSection}>
                <div className={styles.logo}>
                    <span className={styles.logoText}>Focus</span>
                </div>
                <p className={styles.tagline}>Connect, Create, Inspire</p>
            </div>

            <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Version</span>
                    <span className={styles.infoValue}>1.0.0</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Build</span>
                    <span className={styles.infoValue}>2024.11.23</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Platform</span>
                    <span className={styles.infoValue}>Web</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>License</span>
                    <span className={styles.infoValue}>Proprietary</span>
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.creditsSection}>
                <h3 className={styles.creditsTitle}>Credits</h3>
                <div className={styles.creditsList}>
                    <div className={styles.creditItem}>
                        <span className={styles.creditIcon}>👨‍💻</span>
                        <div className={styles.creditInfo}>
                            <span className={styles.creditName}>Development Team</span>
                            <span className={styles.creditRole}>Engineering & Design</span>
                        </div>
                    </div>
                    <div className={styles.creditItem}>
                        <span className={styles.creditIcon}>🎨</span>
                        <div className={styles.creditInfo}>
                            <span className={styles.creditName}>Design System</span>
                            <span className={styles.creditRole}>Lavender UI Framework</span>
                        </div>
                    </div>
                    <div className={styles.creditItem}>
                        <span className={styles.creditIcon}>⚡</span>
                        <div className={styles.creditInfo}>
                            <span className={styles.creditName}>Powered by</span>
                            <span className={styles.creditRole}>React & Supabase</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.footer}>
                <p className={styles.copyright}>© 2024 Focus. All rights reserved.</p>
                <p className={styles.madeWith}>Made with 💜 for creators everywhere</p>
            </div>
        </SettingsSection>
    );
};

export default AboutSection;
