import React from 'react';
import { motion } from 'framer-motion';
import UserAvatar from '../ui/Avatar';
import VerifiedBadge from '../shared/VerifiedBadge';
import ProfileStats from './ProfileStats';
import ProfileBio from './ProfileBio';
import ProfileActions from './ProfileActions';
import styles from './ProfileHeader.module.css';

const ProfileHeader = ({
    profile,
    isOwnProfile,
    isFollowing,
    hasStories = false,
    onFollowStatusChange,
    onFollowersClick,
    onFollowingClick,
    onProfileUpdate,
}) => {
    if (!profile) return null;

    const isTrustShieldVerified = profile.is_verified && profile.trust_level >= 4;
    const trustLevel = profile.trust_level || 0;

    // Determine trust ring color
    const getTrustRingStyle = () => {
        if (trustLevel >= 4) return 'sovereignRing';
        if (trustLevel >= 3) return 'trustedRing';
        if (trustLevel >= 2) return 'confirmedRing';
        if (trustLevel >= 1) return 'realRing';
        return '';
    };

    return (
        <motion.div
            className={styles.nucleus}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* ── Avatar with Trust Ring ─────────────────────────────── */}
            <div className={styles.avatarZone}>
                <motion.div
                    className={`${styles.avatarFrame} ${styles[getTrustRingStyle()] || ''}`}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    {/* Trust ring outer */}
                    {trustLevel >= 1 && (
                        <div className={styles.trustRing} aria-hidden="true" />
                    )}
                    {/* Sovereign pulse for Level 4 */}
                    {isTrustShieldVerified && (
                        <>
                            <div className={styles.sovereignPulse} aria-hidden="true" />
                            <div className={styles.sovereignPulseOuter} aria-hidden="true" />
                        </>
                    )}
                    <UserAvatar
                        src={profile.avatar_url}
                        username={profile.username}
                        fullName={profile.full_name}
                        size="3xl"
                        hasStory={hasStories}
                        isVerified={profile.is_verified}
                        className={styles.avatar}
                    />
                </motion.div>
            </div>

            {/* ── Identity Info ──────────────────────────────────────── */}
            <div className={styles.identityInfo}>
                {/* Name Row */}
                <div className={styles.nameRow}>
                    <div className={styles.nameGroup}>
                        <div className={styles.usernameRow}>
                            <h1 className={styles.username}>{profile.username}</h1>
                            {profile.is_verified && (
                                <VerifiedBadge size={22} trustShield={isTrustShieldVerified} />
                            )}
                        </div>
                        {profile.full_name && (
                            <p className={styles.fullName}>{profile.full_name}</p>
                        )}
                    </div>

                    <ProfileActions
                        profile={profile}
                        isOwnProfile={isOwnProfile}
                        isFollowing={isFollowing}
                        onFollowStatusChange={onFollowStatusChange}
                        onProfileUpdate={onProfileUpdate}
                    />
                </div>

                {/* Stats */}
                <ProfileStats
                    postsCount={profile.posts_count}
                    followersCount={profile.followers_count}
                    followingCount={profile.following_count}
                    boltzCount={profile.boltz_count}
                    onFollowersClick={onFollowersClick}
                    onFollowingClick={onFollowingClick}
                />

                {/* Bio */}
                <ProfileBio
                    fullName={profile.full_name}
                    bio={profile.bio}
                    website={profile.website}
                    location={profile.location}
                />
            </div>
        </motion.div>
    );
};

export default ProfileHeader;
