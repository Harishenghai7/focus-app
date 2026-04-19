/**
 * FocusIDBadge — Focus App v2.0
 *
 * 5-tier badge component with glow effects.
 * Shows inline next to username on Profile, PostCard, Comments, etc.
 *
 * Usage:
 *   <FocusIDBadge tier={2} />                      — Confirmed 🟢
 *   <FocusIDBadge tier={4} size="lg" showLabel />  — Verified 💜 + label
 */

import React from 'react';
import { TIER_ICONS, TIER_LABELS, TIER_COLORS, TIER_GLOWS } from '../../hooks/useFocusID';
import styles from './FocusIDBadge.module.css';

const TIER_DESCRIPTIONS = [
    'Account created via OAuth',
    'Phone verified + profile photo added',
    'Active for 14+ days, bio written, community member in good standing',
    'Trusted by the community — vouched by 3+ Confirmed users or cross-platform verified',
    'Identity verified via video selfie or DigiLocker — highest trust level',
];

const FocusIDBadge = ({
    tier = 0,
    size = 'sm',        // 'xs' | 'sm' | 'md' | 'lg'
    showLabel = false,
    showTooltip = true,
    className = '',
}) => {
    if (tier < 0 || tier > 4) return null;

    // Level 0 (Starter) — show nothing unless explicitly asked
    if (tier === 0 && !showLabel) return null;

    const style = {
        color: TIER_COLORS[tier],
        filter: TIER_GLOWS[tier] !== 'none'
            ? `drop-shadow(0 0 6px ${TIER_COLORS[tier]})`
            : undefined,
    };

    return (
        <span
            className={[styles.badge, styles[`size-${size}`], className].filter(Boolean).join(' ')}
            style={style}
            aria-label={`FocusID ${TIER_LABELS[tier]}`}
            title={showTooltip ? `FocusID ${TIER_LABELS[tier]}: ${TIER_DESCRIPTIONS[tier]}` : undefined}
            role="img"
        >
            <span className={styles.icon}>{TIER_ICONS[tier]}</span>
            {showLabel && (
                <span className={styles.label}>{TIER_LABELS[tier]}</span>
            )}
        </span>
    );
};

export default FocusIDBadge;
