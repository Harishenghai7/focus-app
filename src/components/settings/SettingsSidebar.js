import React from 'react';
import styles from './SettingsSidebar.module.css';

const SettingsSidebar = ({ activeSection, onSectionChange, sections }) => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <h2 className={styles.title}>Settings</h2>
            </div>
            <nav className={styles.nav} aria-label="Settings navigation">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        className={`${styles.navItem} ${activeSection === section.id ? styles.active : ''}`}
                        onClick={() => onSectionChange(section.id)}
                        aria-current={activeSection === section.id ? 'page' : undefined}
                    >
                        <span className={styles.navIcon}>{section.icon}</span>
                        <span className={styles.navLabel}>{section.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default SettingsSidebar;
