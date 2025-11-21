import React, { useId } from 'react';
import PropTypes from 'prop-types';
import './VerificationBadge.css';

/**
 * VerificationBadge - Reusable verification / trust badge component.
 * Renders an icon (emoji or SVG) with color, size variants and optional tooltip.
 */
const SIZE_MAP = { sm: 14, md: 18, lg: 24 };
const TYPE_COLOR_MAP = {
  standard: '#3b82f6', // blue
  premium: '#fbbf24',  // gold
  official: '#8b5cf6'  // purple
};

/**
 * Full badge definitions per Focus Trust Badges system.
 * Each badge can define either a solid color (color) or a gradient (gradient).
 */
export const BADGE_DEFINITIONS = {
  verified_human: { icon: '🔵', color: '#3b82f6', name: 'Verified Human', tooltip: 'Real person verified by Focus Trust Shield' },
  trusted_member: { icon: '🟢', color: '#10b981', name: 'Trusted Member', tooltip: 'Trusted community member with verified activity' },
  verified_id: { icon: '🟡', color: '#fbbf24', name: 'Verified ID', tooltip: 'Identity verified with government ID' },
  community_star: { icon: '🌟', color: '#facc15', name: 'Community Star', tooltip: 'Valued contributor to the Focus community' },
  content_creator: { icon: '🎥', color: '#8b5cf6', name: 'Content Creator', tooltip: 'Active content creator' },
  trending_creator: { icon: '🔥', gradient: 'linear-gradient(135deg,#f97316,#dc2626)', name: 'Trending Creator', tooltip: 'Creates trending content' },
  educator: { icon: '🎓', color: '#2563eb', name: 'Educator', tooltip: 'Shares valuable knowledge with the community' },
  artist: { icon: '🎨', gradient: 'linear-gradient(90deg,#ec4899,#f59e0b,#10b981,#3b82f6,#8b5cf6)', name: 'Artist', tooltip: 'Creative artist on Focus' },
  brand: { icon: '🏢', color: '#1e3a8a', name: 'Brand', tooltip: 'Official brand account' },
  business: { icon: '💼', color: '#0d9488', name: 'Business', tooltip: 'Verified business' },
  media_press: { icon: '📰', color: '#6b7280', name: 'Media / Press', tooltip: 'Verified journalist/media professional' },
  musician: { icon: '🎵', gradient: 'linear-gradient(135deg,#db2777,#8b5cf6)', name: 'Musician', tooltip: 'Verified musician' },
  athlete: { icon: '🏆', color: '#d4af37', name: 'Athlete', tooltip: 'Verified athlete' },
  public_figure: { icon: '🎭', gradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)', name: 'Public Figure', tooltip: 'Verified public figure' },
  government: { icon: '🏛️', color: '#172554', name: 'Government / Official', tooltip: 'Official government account' },
  og_member: { icon: '🎂', color: '#d4af37', name: 'OG Member', tooltip: 'One of the original Focus members' },
  one_year_strong: { icon: '📅', color: '#9ca3af', name: 'One Year Strong', tooltip: 'Been on Focus for over a year!' },
  centurion: { icon: '💯', color: '#dc2626', name: 'Centurion', tooltip: 'Posted 100+ times on Focus' },
  global_connector: { icon: '🌍', gradient: 'linear-gradient(135deg,#0ea5e9,#10b981)', name: 'Global Connector', tooltip: 'Connects people across the globe' },
  community_builder: { icon: '🤝', color: '#f97316', name: 'Community Builder', tooltip: 'Builds meaningful conversations' },
  pride_supporter: { icon: '🌈', gradient: 'linear-gradient(90deg,#e11d48,#f97316,#fbbf24,#10b981,#3b82f6,#8b5cf6)', name: 'Pride Month Supporter', tooltip: 'Supportive during Pride Month' },
  holiday_spirit: { icon: '🎄', gradient: 'linear-gradient(135deg,#dc2626,#16a34a)', name: 'Holiday Spirit', tooltip: 'Positive activity during December' },
  birthday_star: { icon: '🎉', gradient: 'linear-gradient(90deg,#f472b6,#facc15,#34d399,#60a5fa,#a78bfa)', name: 'Birthday Star', tooltip: "It's their birthday today" },
  guardian: { icon: '🛡️', color: '#1d4ed8', name: 'Guardian', tooltip: 'Helps protect the Focus community' },
  helper: { icon: '💝', color: '#ec4899', name: 'Helper', tooltip: 'Always helps others in the community' }
};

// Priority order for selecting a single primary badge (highest first)
export const PRIMARY_BADGE_PRIORITY = [
  'government',
  'public_figure',
  'brand',
  'business',
  'media_press', 'musician', 'athlete',
  'verified_id',
  'trusted_member',
  'verified_human'
];

// Utility to select primary badge type from a list of earned badge type strings
export function selectPrimaryBadge(types = []) {
  for (const key of PRIMARY_BADGE_PRIORITY) {
    if (types.includes(key)) return key;
  }
  return types[0] || null;
}

function VerificationBadge({
  type = 'standard',
  badgeData = {},
  size = 'md',
  showTooltip = true
}) {
  // Unique id for tooltip accessibility
  const tooltipId = useId();
  // Enhanced: fetch definition if type matches one of system badge keys
  const def = BADGE_DEFINITIONS[type] || null;
  const pixelSize = SIZE_MAP[size] || SIZE_MAP.md;
  const { badge_icon, badge_color, tooltip_text, badge_name } = badgeData;
  // Resolve icon, name, description from either provided data or defaults
  const icon = badge_icon || def?.icon || '✓';
  const title = badge_name || def?.name || `${type.charAt(0).toUpperCase()}${type.slice(1)} Badge`;
  const description = tooltip_text || def?.tooltip || 'Verified status badge';
  // Color & gradient handling
  const gradient = def?.gradient;
  const solidColor = badge_color || def?.color || TYPE_COLOR_MAP[type] || TYPE_COLOR_MAP.standard;
  // Use first gradient color for glow if gradient exists
  const glowColor = gradient ? gradient.split(',')[1]?.replace(')', '').trim() || solidColor : solidColor;
  const ariaLabel = `${title}: ${description}`;

  return (
    <span
      className={`verification-badge type-${type} size-${size} ${gradient ? 'gradient' : ''}`}
      style={{
        '--badge-color': glowColor,
        '--badge-size': `${pixelSize}px`,
        ...(gradient ? { '--badge-gradient': gradient } : { color: solidColor })
      }}
      role="img"
      aria-label={ariaLabel}
      aria-describedby={showTooltip ? tooltipId : undefined}
      tabIndex={showTooltip ? 0 : -1}
      data-badge-name={title}
      data-badge-type={type}
    >
      <span className="badge-icon" aria-hidden="true" style={{ fontSize: pixelSize }}>
        {icon}
      </span>
      {showTooltip && (
        <span id={tooltipId} role="tooltip" className="badge-tooltip" aria-hidden="true">
          <strong className="badge-tooltip-title">{title}</strong>
          <span className="badge-tooltip-text">{description}</span>
        </span>
      )}
    </span>
  );
}

VerificationBadge.propTypes = {
  type: PropTypes.oneOf([
    'standard','premium','official',
    'verified_human','trusted_member','verified_id','community_star','content_creator','trending_creator','educator','artist','brand','business','media_press','musician','athlete','public_figure','government','og_member','one_year_strong','centurion','global_connector','community_builder','pride_supporter','holiday_spirit','birthday_star','guardian','helper'
  ]),
  badgeData: PropTypes.shape({
    badge_icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    badge_color: PropTypes.string,
    tooltip_text: PropTypes.string,
    badge_name: PropTypes.string
  }),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showTooltip: PropTypes.bool
};

export default React.memo(VerificationBadge);
// selectPrimaryBadge is already exported on line 61, no need to duplicate
