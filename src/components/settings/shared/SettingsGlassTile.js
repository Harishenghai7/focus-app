import React from 'react';
import styles from './SettingsGlassTile.module.css';

/**
 * Reusable Glassmorphism Tile for Settings sections.
 * Provides consistent card styling across the entire settings ecosystem.
 */
const SettingsGlassTile = ({
    icon,
    title,
    description,
    children,
    variant = 'default', // 'default' | 'danger' | 'success' | 'info'
    className = '',
    collapsible = false,
    defaultOpen = true,
}) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div
            className={`${styles.tile} ${styles[variant]} ${className}`}
        >
            {/* Tile Header */}
            <div
                className={`${styles.tileHeader} ${collapsible ? styles.clickable : ''}`}
                onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
                role={collapsible ? 'button' : undefined}
                tabIndex={collapsible ? 0 : undefined}
                onKeyDown={collapsible ? (e) => e.key === 'Enter' && setIsOpen(!isOpen) : undefined}
            >
                {icon && (
                    <div className={`${styles.tileIcon} ${styles[`icon_${variant}`]}`}>
                        {icon}
                    </div>
                )}
                <div className={styles.tileInfo}>
                    {title && <h3 className={styles.tileTitle}>{title}</h3>}
                    {description && (
                        <p className={styles.tileDescription}>{description}</p>
                    )}
                </div>
                {collapsible && (
                    <svg
                        className={`${styles.collapseIcon} ${isOpen ? styles.collapseOpen : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                )}
            </div>

            {/* Tile Body */}
            {(!collapsible || isOpen) && (
                <div className={styles.tileBody}>{children}</div>
            )}
        </div>
    );
};

/**
 * Setting Row — individual toggle/control row within a tile
 */
export const SettingRow = ({
    label,
    description,
    icon,
    children,
    noBorder = false,
}) => (
    <div className={`${styles.settingRow} ${noBorder ? styles.noBorder : ''}`}>
        <div className={styles.settingInfo}>
            <p className={styles.settingLabel}>
                {icon && <span className={styles.settingIcon}>{icon}</span>}
                {label}
            </p>
            {description && (
                <p className={styles.settingDescription}>{description}</p>
            )}
        </div>
        <div className={styles.settingControl}>{children}</div>
    </div>
);

/**
 * Toggle Switch — premium animated toggle
 */
export const Toggle = ({ checked, onChange, disabled = false, size = 'md' }) => (
    <button
        className={`${styles.toggle} ${checked ? styles.toggleActive : ''} ${styles[`toggle_${size}`]} ${disabled ? styles.toggleDisabled : ''}`}
        onClick={() => !disabled && onChange?.(!checked)}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
    >
        <span className={styles.toggleKnob} />
    </button>
);

/**
 * Select Dropdown — styled select for settings
 */
export const SettingSelect = ({ value, onChange, options, disabled = false }) => (
    <select
        className={styles.settingSelect}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
    >
        {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
                {opt.label}
            </option>
        ))}
    </select>
);

/**
 * Action Button — for settings actions
 */
export const ActionButton = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    icon,
    loading = false,
}) => (
    <button
        className={`${styles.actionBtn} ${styles[`actionBtn_${variant}`]}`}
        onClick={onClick}
        disabled={disabled || loading}
    >
        {loading ? (
            <span className={styles.btnSpinner} />
        ) : (
            icon && <span className={styles.btnIcon}>{icon}</span>
        )}
        {children}
    </button>
);

export default SettingsGlassTile;
