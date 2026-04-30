/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔱 SOVEREIGN BADGE — Phase 5: Verified Human Badge Component
 * Dynamic 3D shield with conic gradient pulse, trust tier visualization
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Renders next to verified users across the platform.
 * Features:
 *   - 3D perspective shield with glassmorphism
 *   - Conic gradient pulse animation
 *   - Trust tier indicator (0-5 levels)
 *   - Hover tooltip with verification details
 *   - Dynamic glow based on trust tier
 */

import React, { useState, useEffect } from 'react';
import styles from './SovereignBadge.module.css';

/**
 * Trust Tier Configuration
 * Each tier has distinct visual characteristics
 */
const TRUST_TIERS = {
  0: { name: 'Unverified', color: '#64748b', glow: '0 0 10px rgba(100, 116, 139, 0.3)', icon: '⚪' },
  1: { name: 'Basic', color: '#22d3ee', glow: '0 0 15px rgba(34, 211, 238, 0.4)', icon: '🔵' },
  2: { name: 'Standard', color: '#a78bfa', glow: '0 0 20px rgba(167, 139, 250, 0.5)', icon: '🟣' },
  3: { name: 'Verified', color: '#8b5cf6', glow: '0 0 30px rgba(139, 92, 246, 0.6)', icon: '🛡️' },
  4: { name: 'Trusted', color: '#ec4899', glow: '0 0 40px rgba(236, 72, 153, 0.6)', icon: '⭐' },
  5: { name: 'Sovereign', color: '#f59e0b', glow: '0 0 50px rgba(245, 158, 11, 0.8)', icon: '👑' },
};

/**
 * Verification Method Labels
 */
const VERIFICATION_METHODS = {
  trust_shield_v3: 'Trust Shield v3',
  digilocker: 'DigiLocker',
  manual_review: 'Manual Review',
  guardian_approved: 'Guardian Approved',
};

const SovereignBadge = ({
  trustTier = 0,
  isVerified = false,
  verificationMethod = 'trust_shield_v3',
  verifiedAt = null,
  showTooltip = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  animated = true,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render if not verified
  if (!isVerified && trustTier < 3) {
    return null;
  }

  const tier = TRUST_TIERS[Math.min(5, Math.max(0, trustTier))];
  const methodLabel = VERIFICATION_METHODS[verificationMethod] || 'Verified';

  // Format verification date
  const verifiedDate = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Dynamic size classes
  const sizeClass = styles[`badge${size.charAt(0).toUpperCase()}${size.slice(1)}`];

  return (
    <div
      className={`${styles.sovereignBadge} ${sizeClass} ${className} ${
        isVisible ? styles.badgeVisible : ''
      } ${animated ? styles.badgeAnimated : ''}`}
      style={{
        '--tier-color': tier.color,
        '--tier-glow': tier.glow,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-tier={trustTier}
      data-testid="sovereign-badge"
    >
      {/* 3D Shield Container */}
      <div
        className={`${styles.shield3D} ${isHovered ? styles.shieldHovered : ''}`}
        style={{
          transform: isHovered ? 'perspective(500px) rotateY(10deg) rotateX(-5deg)' : 'none',
        }}
      >
        {/* Conic Gradient Pulse Ring */}
        <div
          className={`${styles.pulseRing} ${animated ? styles.pulseActive : ''}`}
          style={{
            opacity: 0.3 + (trustTier * 0.15),
          }}
        />

        {/* Inner Glow */}
        <div
          className={styles.innerGlow}
          style={{
            boxShadow: `inset 0 0 20px ${tier.color}40`,
          }}
        />

        {/* Shield Icon */}
        <div className={styles.shieldIcon}>
          <span className={styles.tierIcon}>{tier.icon}</span>
        </div>

        {/* Tier Level Indicator (dots) */}
        <div className={styles.tierDots}>
          {[1, 2, 3, 4, 5].map((level) => (
            <span
              key={level}
              className={`${styles.tierDot} ${
                level <= trustTier ? styles.tierDotActive : ''
              }`}
              style={{
                background: level <= trustTier ? tier.color : 'rgba(255,255,255,0.2)',
                boxShadow: level <= trustTier ? `0 0 8px ${tier.color}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className={styles.badgeTooltip}>
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipIcon}>🛡️</span>
            <span className={styles.tooltipTitle}>{tier.name}</span>
          </div>
          <div className={styles.tooltipBody}>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Method:</span>
              <span className={styles.tooltipValue}>{methodLabel}</span>
            </div>
            {verifiedDate && (
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipLabel}>Verified:</span>
                <span className={styles.tooltipValue}>{verifiedDate}</span>
              </div>
            )}
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Trust Level:</span>
              <span
                className={styles.tooltipValue}
                style={{ color: tier.color }}
              >
                {trustTier}/5
              </span>
            </div>
          </div>
          <div className={styles.tooltipFooter}>
            <span className={styles.tooltipTag}>One Human, One Account</span>
          </div>
        </div>
      )}

      {/* Ambient Glow Effect */}
      <div
        className={styles.ambientGlow}
        style={{
          background: `radial-gradient(circle, ${tier.color}30 0%, transparent 70%)`,
          opacity: isHovered ? 0.6 : 0.3,
        }}
      />
    </div>
  );
};

/**
 * Compact Badge Variant — For inline use (posts, comments)
 */
export const SovereignBadgeCompact = ({
  trustTier = 0,
  isVerified = false,
  size = 'sm',
  className = '',
}) => {
  if (!isVerified && trustTier < 3) return null;

  const tier = TRUST_TIERS[Math.min(5, Math.max(0, trustTier))];

  return (
    <span
      className={`${styles.badgeCompact} ${className}`}
      style={{
        color: tier.color,
        textShadow: `0 0 10px ${tier.color}60`,
      }}
      title={`${tier.name} • Trust Level ${trustTier}/5`}
      data-tier={trustTier}
    >
      <span className={styles.compactIcon}>{tier.icon}</span>
      <span className={styles.compactText}>{tier.name}</span>
    </span>
  );
};

/**
 * Badge Group — Shows multiple verification badges
 */
export const SovereignBadgeGroup = ({
  badges = [],
  maxVisible = 3,
  className = '',
}) => {
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;

  return (
    <div className={`${styles.badgeGroup} ${className}`}>
      {visibleBadges.map((badge, index) => (
        <SovereignBadge
          key={index}
          {...badge}
          size="sm"
          animated={false}
          className={styles.groupBadge}
          style={{
            zIndex: visibleBadges.length - index,
            marginLeft: index > 0 ? '-8px' : '0',
          }}
        />
      ))}
      {remainingCount > 0 && (
        <div className={styles.badgeOverflow}>
          <span className={styles.overflowText}>+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

export default SovereignBadge;
