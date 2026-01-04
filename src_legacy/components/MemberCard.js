import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import styles from './MemberCard.module.css';

/**
 * MemberCard - Display group member information
 * @component
 * @param {Object} member - Member object with profile data
 * @param {boolean} isAdmin - Whether the member is an admin
 * @param {boolean} canRemove - Whether current user can remove this member
 * @param {Function} onRemove - Callback for removing member
 * @param {Function} onMakeAdmin - Callback for making member admin
 * @returns {React.ReactElement}
 */
const MemberCard = React.memo(function MemberCard({ 
  member, 
  isAdmin = false, 
  canRemove = false,
  onRemove,
  onMakeAdmin
}) {
  const navigate = useNavigate();
  const profile = member.profile || member;

  const handleProfileClick = () => {
    if (profile?.id) {
      navigate(`/profile/${profile.id}`);
    }
  };

  return (
    <div className={styles.memberCard}>
      <div className={styles.memberInfo} onClick={handleProfileClick}>
        <img
          src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}`}
          alt={profile?.username}
          className={styles.avatar}
        />
        <div className={styles.details}>
          <div className={styles.nameRow}>
            <span className={styles.name}>
              {profile?.full_name || profile?.username || 'Unknown User'}
            </span>
            {profile?.is_verified && (
              <svg className={styles.verifiedBadge} viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            {isAdmin && (
              <span className={styles.adminBadge}>Admin</span>
            )}
          </div>
          <span className={styles.username}>@{profile?.username || 'unknown'}</span>
        </div>
      </div>

      {canRemove && (
        <div className={styles.actions}>
          {!isAdmin && onMakeAdmin && (
            <button
              className={styles.actionBtn}
              onClick={() => onMakeAdmin(member)}
              title="Make Admin"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              className={styles.removeBtn}
              onClick={() => onRemove(member)}
              title="Remove Member"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

MemberCard.propTypes = {
  member: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool,
  canRemove: PropTypes.bool,
  onRemove: PropTypes.func,
  onMakeAdmin: PropTypes.func
};

export default MemberCard;
