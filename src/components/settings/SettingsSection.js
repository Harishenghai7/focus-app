import React from 'react';
import styles from './SettingsSection.module.css';

const SettingsSection = ({
    id,
    title,
    description,
    icon,
    children,
    isExpanded = true,
    onToggle,
    className = ''
}) => {
    return (
        <div className={`${styles.section} ${className}`} id={id}>
            <button
                className={styles.sectionHeader}
                onClick={() => onToggle && onToggle(id)}
                aria-expanded={isExpanded}
                aria-controls={`${id}-content`}
            >
                <div className={styles.headerLeft}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <div className={styles.headerText}>
                        <h2 className={styles.title}>{title}</h2>
                        {description && <p className={styles.description}>{description}</p>}
                    </div>
                </div>
                <svg
                    className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            <div
                id={`${id}-content`}
                className={`${styles.content} ${isExpanded ? styles.expanded : styles.collapsed}`}
                aria-hidden={!isExpanded}
            >
                <div className={styles.contentInner}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SettingsSection;
